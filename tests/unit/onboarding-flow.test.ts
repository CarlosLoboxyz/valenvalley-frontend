import { describe, it, expect, vi } from 'vitest';
import {
	errorForCode,
	OnboardingFlow,
	type OnboardingLimits
} from '$lib/stores/onboarding.svelte';
import { DEFAULT_PIPELINE_CONFIG } from '$lib/config/pipeline-config';
import type { GroupResponse, JobStatus } from '$lib/services/backend/types';

const limits: OnboardingLimits = {
	creditRates: { premium: 30, stealth: 80 },
	maxCreditsPerJob: 100,
	maxCreditsPerDay: null,
	maxItems: 5
};

const group = (over: Partial<GroupResponse> = {}): GroupResponse => ({
	total_items: 4,
	family_count: 2,
	api_reduction_pct: 50,
	cached_families: 0,
	uncached_families: 2,
	pages: 1,
	stealth: false,
	estimated_credits_premium: 60,
	estimated_credits_stealth: 160,
	estimated_credits_selected: 60,
	granularity: 'balanced',
	families: [],
	warnings: [],
	...over
});

const job = (over: Partial<JobStatus> = {}): JobStatus => ({
	job_id: 'a'.repeat(32),
	rfq_file_id: 'f'.repeat(32),
	granularity: 'fine',
	status: 'running',
	progress: { completed_families: 1, total_families: 2, cache_hits: 0, live_fetches: 1 },
	credits_spent: 30,
	projected_budget: {
		total_families: 2,
		cached_families: 0,
		families_to_scrape: 2,
		pages: 1,
		stealth: false,
		rate_per_page: 30,
		estimated_credits: 60
	},
	family_logs: [],
	warnings: [],
	error: null,
	created_at: '',
	finished_at: null,
	...over
});

type Route = (url: string, init?: RequestInit) => { status?: number; body: unknown };

function makeFetch(routes: Record<string, Route>) {
	const calls: Array<{ url: string; method: string; body: unknown }> = [];
	const impl = vi.fn(async (url: string, init?: RequestInit) => {
		const key = `${init?.method ?? 'GET'} ${url.replace(/[a-f0-9]{32}/, ':id')}`;
		calls.push({
			url,
			method: init?.method ?? 'GET',
			body: init?.body ? JSON.parse(String(init.body)) : undefined
		});
		const route = routes[key];
		if (!route) throw new Error(`unrouted ${key}`);
		const r = route(url, init);
		return new Response(JSON.stringify(r.body), { status: r.status ?? 200 });
	});
	return { impl: impl as unknown as typeof fetch, calls };
}

function flowWith(routes: Record<string, Route>, resume: JobStatus | null = null) {
	const { impl, calls } = makeFetch(routes);
	const navigate = vi.fn(async () => {});
	const onUnauthorized = vi.fn();
	const flow = new OnboardingFlow(
		structuredClone(DEFAULT_PIPELINE_CONFIG),
		limits,
		{ fetch: impl, navigate, onUnauthorized, pollMs: 1 },
		resume
	);
	return { flow, calls, navigate, onUnauthorized };
}

const items = [{ name: 'Martillo', qty: 1, unit: 'pieces' }];
const created = { upload_id: 'f'.repeat(32), filename: 'x.xlsx', row_count: 1 };

describe('OnboardingFlow', () => {
	it('submitList crea la lista, agrupa y pasa a revisión sin gastar créditos', async () => {
		const { flow, calls } = flowWith({
			'POST /api/backend/rfq': () => ({ body: created }),
			'POST /api/backend/group': () => ({ body: group() })
		});
		await flow.submitList(items, 'lista');
		expect(flow.step).toBe('review');
		expect(flow.rfqFileId).toBe(created.upload_id);
		expect(flow.estimatedCredits).toBe(60);
		expect(flow.needsScrape).toBe(true);
		expect(calls.map((c) => c.url)).toEqual(['/api/backend/rfq', '/api/backend/group']);
		expect(calls.some((c) => c.url.includes('jobs'))).toBe(false);
	});

	it('rechaza listas más grandes que el límite sin llamar al backend', async () => {
		const { flow, calls } = flowWith({});
		await flow.submitList(Array.from({ length: 6 }, () => items[0]), null);
		expect(flow.step).toBe('load');
		expect(flow.error?.key).toBe('onboarding.error.tooManyItems');
		expect(calls).toHaveLength(0);
	});

	it('no inicia el scrape sin confirmación explícita', async () => {
		const { flow, calls } = flowWith({
			'POST /api/backend/rfq': () => ({ body: created }),
			'POST /api/backend/group': () => ({ body: group() })
		});
		await flow.submitList(items, null);
		expect(flow.canStart).toBe(false);
		await flow.startScrape();
		expect(flow.step).toBe('review');
		expect(calls.some((c) => c.url === '/api/backend/jobs')).toBe(false);
	});

	it('cambiar las opciones quita la confirmación y recalcula', async () => {
		let estimate = 60;
		const { flow, calls } = flowWith({
			'POST /api/backend/rfq': () => ({ body: created }),
			'POST /api/backend/group': () => ({ body: group({ estimated_credits_selected: estimate }) })
		});
		await flow.submitList(items, null);
		flow.confirmed = true;
		estimate = 120;
		await flow.changeOptions({ pages: 2 });
		expect(flow.confirmed).toBe(false);
		expect(flow.estimatedCredits).toBe(120);
		expect(calls.at(-1)?.body).toMatchObject({ pages: 2, rfqFileId: created.upload_id });
	});

	it('bloquea el inicio si el estimado supera el tope por trabajo', async () => {
		const { flow } = flowWith({
			'POST /api/backend/rfq': () => ({ body: created }),
			'POST /api/backend/group': () => ({ body: group({ estimated_credits_selected: 500 }) })
		});
		await flow.submitList(items, null);
		flow.confirmed = true;
		expect(flow.overJobCap).toBe(true);
		expect(flow.canStart).toBe(false);
	});

	it('con la confirmación inicia el scrape, sondea y termina en resultados', async () => {
		let polls = 0;
		const { flow, calls } = flowWith({
			'POST /api/backend/rfq': () => ({ body: created }),
			'POST /api/backend/group': () => ({ body: group() }),
			'POST /api/backend/jobs': () => ({ status: 202, body: { job_id: 'a'.repeat(32) } }),
			'GET /api/backend/jobs/:id': () => ({
				body: job({ status: ++polls < 2 ? 'running' : 'completed' })
			})
		});
		await flow.submitList(items, null);
		flow.confirmed = true;
		await flow.startScrape();
		expect(flow.step).toBe('progress');
		await vi.waitFor(() => expect(flow.step).toBe('result'));
		expect(flow.job?.status).toBe('completed');
		const start = calls.find((c) => c.url === '/api/backend/jobs');
		expect(start?.body).toMatchObject({ confirm: true, rfqFileId: created.upload_id });
	});

	it('nothing_to_scrape recalcula en lugar de fallar', async () => {
		const { flow } = flowWith({
			'POST /api/backend/rfq': () => ({ body: created }),
			'POST /api/backend/group': () => ({ body: group() }),
			'POST /api/backend/jobs': () => ({
				status: 400,
				body: { error: { code: 'nothing_to_scrape', detail: 'cached' } }
			})
		});
		await flow.submitList(items, null);
		flow.confirmed = true;
		await flow.startScrape();
		expect(flow.step).toBe('review');
		expect(flow.error).toBeNull();
	});

	it('traduce errores del backend a claves de interfaz', async () => {
		const { flow } = flowWith({
			'POST /api/backend/rfq': () => ({ body: created }),
			'POST /api/backend/group': () => ({ body: group() }),
			'POST /api/backend/jobs': () => ({
				status: 400,
				body: { error: { code: 'credit_cap_exceeded', detail: 'x' } }
			})
		});
		await flow.submitList(items, null);
		flow.confirmed = true;
		await flow.startScrape();
		expect(flow.step).toBe('review');
		expect(flow.error?.key).toBe('onboarding.error.creditCap');
		expect(errorForCode('job_conflict').key).toBe('onboarding.error.jobConflict');
		expect(errorForCode('email_not_verified').key).toBe('onboarding.error.emailNotVerified');
		expect(errorForCode('algo_raro', 'detalle').params).toEqual({ message: 'detalle' });
	});

	it('un 401 avisa para cerrar la sesión', async () => {
		const { flow, onUnauthorized } = flowWith({
			'POST /api/backend/rfq': () => ({
				status: 401,
				body: { error: { code: 'invalid_token', detail: 'x' } }
			})
		});
		await flow.submitList(items, null);
		expect(onUnauthorized).toHaveBeenCalled();
	});

	it('reanuda un trabajo activo con su lista y granularidad', async () => {
		const { flow } = flowWith(
			{
				'GET /api/backend/jobs/:id': () => ({ body: job({ status: 'completed' }) })
			},
			job()
		);
		expect(flow.step).toBe('progress');
		expect(flow.rfqFileId).toBe('f'.repeat(32));
		expect(flow.granularity).toBe('fine');
		await vi.waitFor(() => expect(flow.step).toBe('result'));
	});

	it('viewResults puntúa la lista (0 créditos) y navega al dashboard', async () => {
		const { flow, calls, navigate } = flowWith({
			'POST /api/backend/rfq': () => ({ body: created }),
			'POST /api/backend/group': () => ({ body: group({ uncached_families: 0 }) }),
			'POST /api/backend/score': () => ({ body: { report: {} } })
		});
		await flow.submitList(items, null);
		expect(flow.needsScrape).toBe(false);
		await flow.viewResults();
		const score = calls.find((c) => c.url === '/api/backend/score');
		expect(score?.body).toMatchObject({ rfqFileId: created.upload_id });
		expect(navigate).toHaveBeenCalledWith('/');
	});

	it('restart vuelve al inicio y descarta el estado del flujo', async () => {
		const { flow } = flowWith({
			'POST /api/backend/rfq': () => ({ body: created }),
			'POST /api/backend/group': () => ({ body: group() })
		});
		await flow.submitList(items, null);
		flow.restart();
		expect(flow.step).toBe('load');
		expect(flow.rfqFileId).toBeNull();
		expect(flow.group).toBeNull();
	});
});
