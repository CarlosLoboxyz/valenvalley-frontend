import type { MessageKey } from '$lib/i18n';
import type {
	GroupResponse,
	JobStatus,
	PublicConfig,
	RfqCreated,
	RfqItemInput
} from '$lib/services/backend/types';
import type { Granularity, PipelineConfig } from '$lib/types/sourcing';

export type OnboardingStep = 'load' | 'review' | 'progress' | 'result';

/** Error de la vista: clave de traducción + parámetros (nunca texto fijo). */
export interface FlowError {
	key: MessageKey;
	params?: Record<string, string | number>;
}

export interface OnboardingLimits {
	creditRates: { premium: number; stealth: number };
	maxCreditsPerJob: number | null;
	maxCreditsPerDay: number | null;
	maxItems: number;
}

export interface OnboardingDeps {
	fetch?: typeof fetch;
	/** Navega al dashboard (y refresca los datos del servidor). */
	navigate: (url: string) => Promise<void>;
	/** Cierra la sesión al recibir un 401. */
	onUnauthorized?: () => void;
	pollMs?: number;
}

const TERMINAL = new Set(['completed', 'failed', 'cancelled']);
const MAX_POLL_FAILURES = 4;

export function limitsFromConfig(config: PublicConfig, maxItems: number): OnboardingLimits {
	return {
		creditRates: {
			premium: config.credit_rates.premium_per_page,
			stealth: config.credit_rates.stealth_per_page
		},
		maxCreditsPerJob: config.max_credits_per_job,
		maxCreditsPerDay: config.max_credits_per_day,
		maxItems
	};
}

/** Traduce el código de error del backend a un mensaje (clave) de la interfaz. */
export function errorForCode(code: string, detail?: unknown): FlowError {
	switch (code) {
		case 'credit_cap_exceeded':
			return { key: 'onboarding.error.creditCap' };
		case 'job_conflict':
			return { key: 'onboarding.error.jobConflict' };
		case 'scrapingbee_not_configured':
			return { key: 'onboarding.error.noApiKey' };
		case 'email_not_verified':
			return { key: 'onboarding.error.emailNotVerified' };
		case 'invalid_rfq':
		case 'invalid_request':
			return { key: 'onboarding.error.invalidList', params: { message: String(detail ?? '') } };
		case 'backend_disabled':
		case 'upstream_unavailable':
			return { key: 'error.backendUnavailable' };
		default:
			return { key: 'onboarding.error.generic', params: { message: String(detail ?? code) } };
	}
}

/**
 * Flujo guiado: cargar lista → revisar (familias y créditos) → scrape con confirmación →
 * progreso → resultados. Todas las llamadas pasan por los proxies `/api/backend/*` de SvelteKit
 * (el navegador nunca habla con FastAPI). Una instancia por página.
 */
export class OnboardingFlow {
	readonly limits: OnboardingLimits;

	step = $state<OnboardingStep>('load');
	busy = $state(false);
	error = $state<FlowError | null>(null);

	rfq = $state<RfqCreated | null>(null);
	rfqFileId = $state<string | null>(null);
	group = $state<GroupResponse | null>(null);
	job = $state<JobStatus | null>(null);

	granularity = $state<Granularity>('balanced');
	pages = $state(1);
	stealth = $state(false);
	/** Reconocimiento explícito del gasto de créditos. Se reinicia al cambiar las opciones. */
	confirmed = $state(false);

	estimatedCredits = $derived(this.group?.estimated_credits_selected ?? 0);
	needsScrape = $derived((this.group?.uncached_families ?? 0) > 0);
	overJobCap = $derived.by(() => {
		const cap = this.limits.maxCreditsPerJob;
		return cap !== null && this.estimatedCredits > cap;
	});
	canStart = $derived(
		this.needsScrape && this.confirmed && !this.overJobCap && !this.busy && this.group !== null
	);
	progressPct = $derived.by(() => {
		const total = this.job?.progress.total_families ?? 0;
		if (!total) return 0;
		return Math.min(100, Math.round(((this.job?.progress.completed_families ?? 0) / total) * 100));
	});

	private readonly fetchImpl: typeof fetch;
	private pollTimer: ReturnType<typeof setTimeout> | null = null;
	private polling = false;

	constructor(
		private readonly pipeline: PipelineConfig,
		limits: OnboardingLimits,
		private readonly deps: OnboardingDeps,
		resumeJob: JobStatus | null = null
	) {
		this.limits = limits;
		this.fetchImpl = deps.fetch ?? fetch;
		this.granularity = pipeline.granularity;
		this.pages = pipeline.pagesPerFamily;
		this.stealth = pipeline.stealthProxy;
		if (resumeJob) this.resume(resumeJob);
	}

	// ── API ────────────────────────────────────────────────────────────
	private async api<T>(
		path: string,
		init?: { method?: string; body?: unknown }
	): Promise<{ ok: true; data: T } | { ok: false; status: number; code: string; error: FlowError }> {
		let response: Response;
		try {
			response = await this.fetchImpl(path, {
				method: init?.method ?? 'GET',
				headers: init?.body === undefined ? undefined : { 'Content-Type': 'application/json' },
				body: init?.body === undefined ? undefined : JSON.stringify(init.body)
			});
		} catch {
			return {
				ok: false,
				status: 0,
				code: 'upstream_unavailable',
				error: errorForCode('upstream_unavailable')
			};
		}
		let payload: unknown = null;
		try {
			payload = await response.json();
		} catch {
			payload = null;
		}
		if (response.ok) return { ok: true, data: payload as T };
		if (response.status === 401) this.deps.onUnauthorized?.();
		const body = (payload ?? {}) as { error?: { code?: string; detail?: unknown } };
		const code = body.error?.code ?? 'backend_error';
		return { ok: false, status: response.status, code, error: errorForCode(code, body.error?.detail) };
	}

	// ── Pasos ──────────────────────────────────────────────────────────
	/** Paso 1 → 2: crea la lista en el backend y calcula familias y estimado (0 créditos). */
	async submitList(items: RfqItemInput[], filename: string | null): Promise<void> {
		if (this.busy) return;
		if (items.length === 0) return;
		if (items.length > this.limits.maxItems) {
			this.error = { key: 'onboarding.error.tooManyItems', params: { max: this.limits.maxItems } };
			return;
		}
		this.busy = true;
		this.error = null;
		try {
			const created = await this.api<RfqCreated>('/api/backend/rfq', {
				method: 'POST',
				body: { filename, items }
			});
			if (!created.ok) {
				this.error = created.error;
				return;
			}
			this.rfq = created.data;
			this.rfqFileId = created.data.upload_id;
			if (await this.regroup()) this.step = 'review';
		} finally {
			this.busy = false;
		}
	}

	/** Recalcula familias y créditos con las opciones actuales. Devuelve `false` si falla. */
	async regroup(): Promise<boolean> {
		if (!this.rfqFileId) return false;
		this.confirmed = false;
		const result = await this.api<GroupResponse>('/api/backend/group', {
			method: 'POST',
			body: {
				rfqFileId: this.rfqFileId,
				granularity: this.granularity,
				pages: this.pages,
				stealth: this.stealth
			}
		});
		if (!result.ok) {
			this.error = result.error;
			return false;
		}
		this.error = null;
		this.group = result.data;
		return true;
	}

	async changeOptions(next: { granularity?: Granularity; pages?: number; stealth?: boolean }) {
		if (this.busy) return;
		if (next.granularity !== undefined) this.granularity = next.granularity;
		if (next.pages !== undefined) this.pages = Math.min(5, Math.max(1, Math.round(next.pages) || 1));
		if (next.stealth !== undefined) this.stealth = next.stealth;
		this.busy = true;
		try {
			await this.regroup();
		} finally {
			this.busy = false;
		}
	}

	/** Paso 2 → 3: GASTA créditos. Sólo con la confirmación explícita del usuario. */
	async startScrape(): Promise<void> {
		if (!this.canStart || !this.rfqFileId) return;
		this.busy = true;
		this.error = null;
		try {
			const result = await this.api<{ job_id: string }>('/api/backend/jobs', {
				method: 'POST',
				body: {
					rfqFileId: this.rfqFileId,
					granularity: this.granularity,
					pages: this.pages,
					stealth: this.stealth,
					confirm: true
				}
			});
			if (!result.ok) {
				if (result.code === 'nothing_to_scrape') {
					await this.regroup(); // la caché ya lo cubre
					return;
				}
				this.error = result.error;
				return;
			}
			this.job = null;
			this.step = 'progress';
			this.startPolling(result.data.job_id);
		} finally {
			this.busy = false;
		}
	}

	/** Reanuda un trabajo activo tras recargar la página. */
	private resume(job: JobStatus) {
		this.rfqFileId = job.rfq_file_id;
		if (job.granularity === 'fine' || job.granularity === 'balanced' || job.granularity === 'broad') {
			this.granularity = job.granularity;
		}
		this.job = job;
		this.step = 'progress';
		this.startPolling(job.job_id);
	}

	startPolling(jobId: string): void {
		this.stopPolling();
		this.polling = true;
		let failures = 0;
		const tick = async () => {
			if (!this.polling) return;
			const result = await this.api<JobStatus>(`/api/backend/jobs/${encodeURIComponent(jobId)}`);
			if (!this.polling) return;
			if (result.ok) {
				failures = 0;
				this.job = result.data;
				if (TERMINAL.has(result.data.status)) {
					this.polling = false;
					this.step = 'result';
					return;
				}
			} else if (++failures >= MAX_POLL_FAILURES || result.status === 404 || result.status === 401) {
				this.polling = false;
				this.error = result.error;
				return;
			}
			this.pollTimer = setTimeout(tick, this.deps.pollMs ?? 2000);
		};
		this.pollTimer = setTimeout(tick, 0);
	}

	stopPolling(): void {
		this.polling = false;
		if (this.pollTimer) clearTimeout(this.pollTimer);
		this.pollTimer = null;
	}

	async cancel(): Promise<void> {
		if (!this.job || this.busy) return;
		this.busy = true;
		try {
			const result = await this.api<JobStatus>(
				`/api/backend/jobs/${encodeURIComponent(this.job.job_id)}/cancel`,
				{ method: 'POST' }
			);
			if (result.ok) this.job = result.data;
			else if (result.code !== 'job_not_active') this.error = result.error;
		} finally {
			this.busy = false;
		}
	}

	/** Puntúa la lista con lo que haya en caché (0 créditos), la guarda como último análisis y abre el dashboard. */
	async viewResults(): Promise<void> {
		if (!this.rfqFileId || this.busy) return;
		this.busy = true;
		this.error = null;
		try {
			const result = await this.api<unknown>('/api/backend/score', {
				method: 'POST',
				body: {
					rfqFileId: this.rfqFileId,
					positions: null,
					config: { ...this.pipeline, granularity: this.granularity }
				}
			});
			if (!result.ok) {
				this.error = result.error;
				return;
			}
			await this.deps.navigate('/');
		} finally {
			this.busy = false;
		}
	}

	/** Vuelve al paso 1 conservando nada del flujo anterior. */
	restart(): void {
		this.stopPolling();
		this.step = 'load';
		this.rfq = null;
		this.rfqFileId = null;
		this.group = null;
		this.job = null;
		this.confirmed = false;
		this.error = null;
	}
}
