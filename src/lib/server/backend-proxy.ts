/**
 * Utilidades de las rutas proxy `/api/backend/*`: el navegador nunca habla con FastAPI.
 * Cada ruta añade el token de PocketBase del usuario en sesión y traduce los errores.
 */
import { json, type Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { loadBackendConfig } from '$lib/config/backend';
import { clearSessionCookie, forgetToken } from '$lib/server/session';
import { BackendClient, BackendHttpError } from '$lib/services/backend/client';

export interface ProxyEvent {
	locals: App.Locals;
	cookies: Cookies;
}

export type ErrorBody = { error: { code: string; detail: unknown } };

export function errorResponse(status: number, code: string, detail: unknown): Response {
	return json({ error: { code, detail } } satisfies ErrorBody, { status });
}

/** Ejecuta `fn` con un cliente autenticado y devuelve su resultado como JSON. */
export async function withBackend<T>(
	event: ProxyEvent,
	fn: (client: BackendClient) => Promise<T>
): Promise<Response> {
	const config = loadBackendConfig(env, event.locals.pbToken);
	if (!config.enabled) {
		return errorResponse(503, 'backend_disabled', 'BACKEND_URL is not configured');
	}
	try {
		return json(await fn(new BackendClient(config)));
	} catch (err) {
		if (err instanceof BackendHttpError) {
			if (err.status === 401) {
				if (event.locals.pbToken) forgetToken(event.locals.pbToken);
				clearSessionCookie(event.cookies);
			}
			return errorResponse(err.status, err.code, err.detail);
		}
		return errorResponse(
			502,
			'upstream_unavailable',
			err instanceof Error ? err.message : 'backend call failed'
		);
	}
}

/** Lee el cuerpo JSON como objeto; `null` si no es un objeto JSON. */
export async function readObject(request: Request): Promise<Record<string, unknown> | null> {
	try {
		const body = await request.json();
		return body && typeof body === 'object' && !Array.isArray(body)
			? (body as Record<string, unknown>)
			: null;
	} catch {
		return null;
	}
}

const JOB_ID = /^[a-f0-9]{32}$/;
export const isJobId = (value: string): boolean => JOB_ID.test(value);
