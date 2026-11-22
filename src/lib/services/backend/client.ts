import type { BackendConfig } from '$lib/config/backend';
import { apiBase } from '$lib/config/backend';
import {
	parseBackendError,
	parseHealthResponse,
	parseLatestResponse,
	parsePublicConfig,
	parseScoreResponse
} from './schemas';
import type {
	HealthResponse,
	LatestResponse,
	PublicConfig,
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
}
