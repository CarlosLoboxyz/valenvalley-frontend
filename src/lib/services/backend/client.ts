import type { BackendConfig } from '$lib/config/backend';
import { apiBase } from '$lib/config/backend';
import {
	parseActiveJob,
	parseBackendError,
	parseGroupResponse,
	parseHealthResponse,
	parseJobCreated,
	parseJobStatus,
	parseLatestResponse,
	parsePublicConfig,
	parseRfqCreated,
	parseScoreResponse
} from './schemas';
import type {
	GroupResponse,
	HealthResponse,
	JobCreated,
	JobStatus,
	LatestResponse,
	PublicConfig,
	RfqCreated,
	RfqItemInput,
	ScoreResponse
} from './types';

/** Error tipado de una llamada al backend. */
export class BackendHttpError extends Error {
	constructor(
		readonly status: number,
		readonly code: string,
		readonly detail: unknown
	) {
		super(`${code}: ${String(detail)}`);
	}
}

function authHeaders(config: BackendConfig): HeadersInit {
	return config.authToken
		? { Authorization: `Bearer ${config.authToken}` }
		: {};
}

async function request(
	config: BackendConfig,
	path: string,
	init?: RequestInit
): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), config.timeoutMs);
	try {
		return await fetch(`${apiBase(config)}${path}`, {
			...init,
			headers: {
				'Content-Type': 'application/json',
				...authHeaders(config),
				...(init?.headers ?? {})
			},
			signal: controller.signal
		});
	} finally {
		clearTimeout(timer);
	}
}

async function readJson(response: Response): Promise<unknown> {
	try {
		return await response.json();
	} catch {
		return null;
	}
}

async function unwrap(response: Response): Promise<unknown> {
	if (response.ok) return readJson(response);
	const body = (await readJson(response)) as { code?: string; detail?: unknown } | null;
	const parsed = parseBackendError(body ?? {});
	throw new BackendHttpError(response.status, parsed.code, parsed.detail);
}

/** Cliente tipado del backend. Solo lo usan rutas de servidor. */
export class BackendClient {
	constructor(private readonly config: BackendConfig) {}

	get isEnabled(): boolean {
		return this.config.enabled;
	}

	async health(): Promise<HealthResponse> {
		const response = await request(this.config, '/health');
		const body = await unwrap(response);
		return parseHealthResponse(body);
	}

	async publicConfig(): Promise<PublicConfig> {
		const response = await request(this.config, '/config');
		const body = await unwrap(response);
		return parsePublicConfig(body);
	}

	async recommendationsLatest(): Promise<LatestResponse> {
		const response = await request(this.config, '/recommendations/latest');
		const body = await unwrap(response);
		return parseLatestResponse(body);
	}

	async recommendationsScore(scoreRequest: Record<string, unknown>): Promise<ScoreResponse> {
		const response = await request(this.config, '/recommendations/score', {
			method: 'POST',
			body: JSON.stringify(scoreRequest)
		});
		const body = await unwrap(response);
		return parseScoreResponse(body);
	}

	/** Crea una lista de materiales (RFQ) a partir de filas ya validadas. 0 créditos. */
	async createRfqItems(filename: string | null, items: RfqItemInput[]): Promise<RfqCreated> {
		const response = await request(this.config, '/rfq/items', {
			method: 'POST',
			body: JSON.stringify({ filename, items })
		});
		return parseRfqCreated(await unwrap(response));
	}

	/** Agrupado en familias + estimado de créditos. 0 créditos. */
	async rfqGroup(payload: Record<string, unknown>): Promise<GroupResponse> {
		const response = await request(this.config, '/rfq/group', {
			method: 'POST',
			body: JSON.stringify(payload)
		});
		return parseGroupResponse(await unwrap(response));
	}

	/** Inicia un scrape que GASTA créditos; el backend exige `confirm_credit_spend: true`. */
	async startScrape(payload: Record<string, unknown>): Promise<JobCreated> {
		const response = await request(this.config, '/jobs/scrape', {
			method: 'POST',
			body: JSON.stringify(payload)
		});
		return parseJobCreated(await unwrap(response));
	}

	async jobStatus(jobId: string): Promise<JobStatus> {
		const response = await request(this.config, `/jobs/${encodeURIComponent(jobId)}`);
		return parseJobStatus(await unwrap(response));
	}

	async cancelJob(jobId: string): Promise<JobStatus> {
		const response = await request(this.config, `/jobs/${encodeURIComponent(jobId)}/cancel`, {
			method: 'POST'
		});
		return parseJobStatus(await unwrap(response));
	}

	/** Trabajo activo (en cola o ejecutándose) del usuario, o `null`. */
	async activeJob(): Promise<JobStatus | null> {
		const response = await request(this.config, '/jobs/active');
		return parseActiveJob(await unwrap(response));
	}
}
