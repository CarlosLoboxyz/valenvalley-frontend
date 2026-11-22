import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { loginSchema } from '$lib/schemas/auth';
import { setSessionCookie, safeRedirect } from '$lib/server/session';
import { authWithPassword, loadPocketBaseConfig, PocketBaseError } from '$lib/services/pocketbase';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) throw redirect(303, safeRedirect(url.searchParams.get('redirectTo')));
	return {
		registered: url.searchParams.get('registered') === '1',
		signupEnabled: (env.SIGNUP_ENABLED ?? 'true').toLowerCase() !== 'false'
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '');
		const password = String(form.get('password') ?? '');

		const parsed = loginSchema.safeParse({ email, password });

		if (!parsed.success) {
			// Los valores son claves de traducción; el cliente las traduce al idioma activo.
			const fieldErrors: Record<string, string> = {};
			for (const issue of parsed.error.issues) {
				const key = String(issue.path[0] ?? '');
				if (key && !(key in fieldErrors)) fieldErrors[key] = issue.message;
			}
			return fail(400, { type: 'error' as const, fieldErrors, email });
		}

		try {
			const session = await authWithPassword(
				loadPocketBaseConfig(env),
				parsed.data.email,
				parsed.data.password
			);
			setSessionCookie(cookies, session.token, url.protocol === 'https:');
		} catch (err) {
			const unavailable = !(err instanceof PocketBaseError) || err.status === 0 || err.status >= 500;
			return fail(unavailable ? 503 : 400, {
				type: 'error' as const,
				fieldErrors: {},
				formError: unavailable ? 'auth.error.unavailable' : 'auth.error.invalidCredentials',
				email: parsed.data.email
			});
		}

		throw redirect(303, safeRedirect(url.searchParams.get('redirectTo')));
	}
};
