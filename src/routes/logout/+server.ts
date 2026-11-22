import { redirect } from '@sveltejs/kit';
import { clearSessionCookie, forgetToken } from '$lib/server/session';
import type { RequestHandler } from './$types';

/** Sólo POST: un GET (p. ej. un <img>) no debe poder cerrar la sesión de nadie. */
export const POST: RequestHandler = ({ cookies, locals }) => {
	if (locals.pbToken) forgetToken(locals.pbToken);
	clearSessionCookie(cookies);
	throw redirect(303, '/login');
};
