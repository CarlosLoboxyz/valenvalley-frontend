/**
 * Cliente mínimo (fetch, sin SDK) de la API REST de PocketBase. SOLO para código de servidor.
 *
 * El login ocurre en el servidor de SvelteKit: el navegador nunca habla con PocketBase y el
 * token vive en una cookie httpOnly. Ese mismo token se reenvía al backend FastAPI como Bearer.
 *
 * - `POCKETBASE_URL` — base de PocketBase (p. ej. `http://pocketbase:8090`).
 * - `POCKETBASE_TIMEOUT_MS` — timeout por llamada (por defecto 8000).
 * - `POCKETBASE_USERS_COLLECTION` — colección de autenticación (por defecto `users`).
 */

export interface PocketBaseConfig {
	baseUrl: string;
	timeoutMs: number;
	collection: string;
}

export interface PocketBaseUser {
	id: string;
	email: string;
	verified: boolean;
	name?: string;
}

export interface PocketBaseSession {
	token: string;
	user: PocketBaseUser;
}

/** Error tipado de PocketBase. `status` 0 = PocketBase no responde (red/timeout). */
export class PocketBaseError extends Error {
	constructor(
		readonly status: number,
		message: string,
		readonly fieldCodes: Record<string, string> = {}
	) {
		super(message);
		this.name = 'PocketBaseError';
	}
}

const DEFAULT_TIMEOUT_MS = 8000;

export function loadPocketBaseConfig(env: Record<string, string | undefined>): PocketBaseConfig {
	const timeout = Number(env.POCKETBASE_TIMEOUT_MS);
	return {
		baseUrl: (env.POCKETBASE_URL ?? 'http://localhost:8090').trim().replace(/\/+$/, ''),
		timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_TIMEOUT_MS,
		collection: (env.POCKETBASE_USERS_COLLECTION ?? 'users').trim() || 'users'
	};
}

async function call(
	config: PocketBaseConfig,
	path: string,
	init: { method?: string; body?: unknown; token?: string } = {},
	fetchImpl: typeof fetch = fetch
): Promise<unknown> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), config.timeoutMs);
	let response: Response;
	try {
		response = await fetchImpl(`${config.baseUrl}${path}`, {
			method: init.method ?? 'GET',
			headers: {
				'Content-Type': 'application/json',
				...(init.token ? { Authorization: `Bearer ${init.token}` } : {})
			},
			body: init.body === undefined ? undefined : JSON.stringify(init.body),
			signal: controller.signal
		});
	} catch {
		throw new PocketBaseError(0, 'PocketBase unavailable');
	} finally {
		clearTimeout(timer);
	}

	let payload: unknown = null;
	try {
		payload = await response.json();
	} catch {
		payload = null;
	}
	if (!response.ok) {
		const body = (payload ?? {}) as {
			message?: string;
			data?: Record<string, { code?: string }>;
		};
		const fieldCodes: Record<string, string> = {};
		for (const [field, info] of Object.entries(body.data ?? {})) {
			if (info?.code) fieldCodes[field] = info.code;
		}
		throw new PocketBaseError(response.status, body.message ?? `HTTP ${response.status}`, fieldCodes);
	}
	return payload;
}

function parseSession(payload: unknown): PocketBaseSession {
	const body = (payload ?? {}) as { token?: unknown; record?: Record<string, unknown> };
	const record = body.record ?? {};
	if (typeof body.token !== 'string' || typeof record.id !== 'string') {
		throw new PocketBaseError(502, 'Unexpected PocketBase auth response');
	}
	return {
		token: body.token,
		user: {
			id: record.id,
			email: String(record.email ?? ''),
			verified: Boolean(record.verified),
			name: typeof record.name === 'string' && record.name ? record.name : undefined
		}
	};
}

const collectionPath = (config: PocketBaseConfig) =>
	`/api/collections/${encodeURIComponent(config.collection)}`;

export async function authWithPassword(
	config: PocketBaseConfig,
	email: string,
	password: string,
	fetchImpl?: typeof fetch
): Promise<PocketBaseSession> {
	const payload = await call(
		config,
		`${collectionPath(config)}/auth-with-password`,
		{ method: 'POST', body: { identity: email, password } },
		fetchImpl
	);
	return parseSession(payload);
}

/** Valida el token y devuelve un token renovado + el usuario actual. */
export async function authRefresh(
	config: PocketBaseConfig,
	token: string,
	fetchImpl?: typeof fetch
): Promise<PocketBaseSession> {
	const payload = await call(
		config,
		`${collectionPath(config)}/auth-refresh`,
		{ method: 'POST', token },
		fetchImpl
	);
	return parseSession(payload);
}

export async function createUser(
	config: PocketBaseConfig,
	email: string,
	password: string,
	fetchImpl?: typeof fetch
): Promise<void> {
	await call(
		config,
		`${collectionPath(config)}/records`,
		{ method: 'POST', body: { email, password, passwordConfirm: password, emailVisibility: false } },
		fetchImpl
	);
}

export async function requestVerification(
	config: PocketBaseConfig,
	email: string,
	fetchImpl?: typeof fetch
): Promise<void> {
	await call(
		config,
		`${collectionPath(config)}/request-verification`,
		{ method: 'POST', body: { email } },
		fetchImpl
	);
}

/** `exp` (segundos epoch) del JWT sin verificar la firma; `null` si no es legible. */
export function tokenExpiry(token: string): number | null {
	const part = token.split('.')[1];
	if (!part) return null;
	try {
		const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
		const bytes = Uint8Array.from(atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '=')), (c) => c.charCodeAt(0));
		const json = new TextDecoder().decode(bytes);
		const exp = (JSON.parse(json) as { exp?: unknown }).exp;
		return typeof exp === 'number' ? exp : null;
	} catch {
		return null;
	}
}
