/**
 * Sesión del usuario: el token de PocketBase vive en una cookie httpOnly. SOLO servidor.
 */
import type { Cookies } from '@sveltejs/kit';
import {
	authRefresh,
	tokenExpiry,
	type PocketBaseConfig,
	type PocketBaseUser
} from '$lib/services/pocketbase';

export const SESSION_COOKIE = 'vv_pb_token';

/** Renueva el token cuando le queda menos de este margen (segundos). */
export const REFRESH_WINDOW_SECONDS = 24 * 60 * 60;
/** Un token ya validado contra PocketBase no se revalida durante este tiempo (ms). */
export const VALIDATION_TTL_MS = 60_000;

export interface ResolvedSession {
	user: PocketBaseUser;
	token: string;
}

interface CacheEntry {
	until: number;
	user: PocketBaseUser;
}

const validated = new Map<string, CacheEntry>();

function remember(token: string, user: PocketBaseUser, now: number): void {
	if (validated.size > 1024) {
		for (const [key, entry] of validated) if (entry.until <= now) validated.delete(key);
		if (validated.size > 1024) validated.clear();
	}
	validated.set(token, { until: now + VALIDATION_TTL_MS, user });
}

export function forgetToken(token: string): void {
	validated.delete(token);
}

export function setSessionCookie(cookies: Cookies, token: string, secure: boolean): void {
	const exp = tokenExpiry(token);
	const maxAge = exp ? Math.max(60, exp - Math.floor(Date.now() / 1000)) : 60 * 60 * 24 * 7;
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure,
		maxAge
	});
}

export function clearSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

/**
 * Resuelve el usuario de la cookie. Devuelve `null` si no hay sesión válida.
 * Lanza `PocketBaseError` con status 0 si PocketBase no responde (la sesión no se descarta).
 */
export async function resolveSession(
	config: PocketBaseConfig,
	cookies: Cookies,
	secure: boolean,
	now: number = Date.now()
): Promise<ResolvedSession | null> {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return null;

	const exp = tokenExpiry(token);
	if (exp !== null && exp * 1000 <= now) {
		forgetToken(token);
		clearSessionCookie(cookies);
		return null;
	}

	const nearExpiry = exp !== null && exp - now / 1000 < REFRESH_WINDOW_SECONDS;
	const cached = validated.get(token);
	if (cached && cached.until > now && !nearExpiry) {
		return { user: cached.user, token };
	}

	try {
		const refreshed = await authRefresh(config, token);
		// Se conserva el token actual salvo que esté por vencer.
		const effective = nearExpiry ? refreshed.token : token;
		if (effective !== token) {
			forgetToken(token);
			setSessionCookie(cookies, effective, secure);
		}
		remember(effective, refreshed.user, now);
		return { user: refreshed.user, token: effective };
	} catch (err) {
		const status = (err as { status?: number }).status;
		if (status === 0 || (typeof status === 'number' && status >= 500)) throw err;
		forgetToken(token);
		clearSessionCookie(cookies);
		return null;
	}
}

const PUBLIC_PATHS = ['/login', '/signup', '/logout'];

export function isPublicPath(pathname: string): boolean {
	return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Sólo rutas internas relativas (evita open-redirect vía `redirectTo`). */
export function safeRedirect(target: string | null | undefined, fallback = '/materiales'): string {
	if (!target || !target.startsWith('/') || target.startsWith('//') || target.includes('\\')) {
		return fallback;
	}
	return target;
}
