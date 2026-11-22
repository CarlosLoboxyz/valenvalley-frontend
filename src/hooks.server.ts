import type { Handle } from '@sveltejs/kit';
import { LOCALE_COOKIE, THEME_COOKIE, readLocale, readTheme } from '$lib/preferences/constants';

/**
 * Lee las preferencias de las cookies y las inyecta en <html lang data-theme> durante el
 * render en servidor, así el tema y el idioma correctos llegan sin parpadeo.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const theme = readTheme(event.cookies.get(THEME_COOKIE));
	const locale = readLocale(event.cookies.get(LOCALE_COOKIE));

	event.locals.theme = theme;
	event.locals.locale = locale;

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', locale).replace('%theme%', theme)
	});
};
