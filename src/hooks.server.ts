import { redirect, type Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { LOCALE_COOKIE, THEME_COOKIE, readLocale, readTheme } from '$lib/preferences/constants';
import { loadPocketBaseConfig } from '$lib/services/pocketbase';
import { isPublicPath, resolveSession } from '$lib/server/session';

/**
 * 1. Lee las preferencias de las cookies y las inyecta en <html lang data-theme> durante el
 *    render en servidor, así el tema y el idioma correctos llegan sin parpadeo.
 * 2. Resuelve la sesión de PocketBase (cookie httpOnly) → `locals.user` / `locals.pbToken`
 *    y protege todas las rutas salvo /login, /signup y /logout.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const theme = readTheme(event.cookies.get(THEME_COOKIE));
	const locale = readLocale(event.cookies.get(LOCALE_COOKIE));

	event.locals.theme = theme;
	event.locals.locale = locale;
	event.locals.user = null;
	event.locals.pbToken = null;

	const { pathname } = event.url;
	const isApi = pathname.startsWith('/api/');
	const secure = event.url.protocol === 'https:';

	try {
		const session = await resolveSession(loadPocketBaseConfig(env), event.cookies, secure);
		if (session) {
			event.locals.user = session.user;
			event.locals.pbToken = session.token;
		}
	} catch {
		// PocketBase no responde: no se descarta la sesión, pero tampoco se sirve contenido protegido.
		if (!isPublicPath(pathname)) {
			return isApi
				? Response.json(
						{ error: { code: 'auth_unavailable', detail: 'Authentication service unavailable' } },
						{ status: 503 }
					)
				: new Response('Authentication service unavailable', { status: 503 });
		}
	}

	if (!event.locals.user && !isPublicPath(pathname)) {
		if (isApi) {
			return Response.json(
				{ error: { code: 'unauthorized', detail: 'Authentication required' } },
				{ status: 401 }
			);
		}
		const target = pathname + event.url.search;
		throw redirect(303, `/login?redirectTo=${encodeURIComponent(target)}`);
	}

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', locale).replace('%theme%', theme)
	});
};
