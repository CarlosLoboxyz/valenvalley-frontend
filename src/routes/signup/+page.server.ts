import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { signupSchema } from '$lib/schemas/auth';
import { safeRedirect, setSessionCookie } from '$lib/server/session';
import {
	authWithPassword,
	createUser,
	loadPocketBaseConfig,
	PocketBaseError,
	requestVerification
} from '$lib/services/pocketbase';
import type { Actions, PageServerLoad } from './$types';

const signupEnabled = () => (env.SIGNUP_ENABLED ?? 'true').toLowerCase() !== 'false';

export const load: PageServerLoad = ({ locals, url }) => {
	if (!signupEnabled()) throw redirect(303, '/login');
	if (locals.user) throw redirect(303, safeRedirect(url.searchParams.get('redirectTo')));
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		if (!signupEnabled()) throw redirect(303, '/login');

		const form = await request.formData();
		const email = String(form.get('email') ?? '');
		const password = String(form.get('password') ?? '');
		const passwordConfirm = String(form.get('passwordConfirm') ?? '');

		const parsed = signupSchema.safeParse({ email, password, passwordConfirm });
		if (!parsed.success) {
			const fieldErrors: Record<string, string> = {};
			for (const issue of parsed.error.issues) {
				const key = String(issue.path[0] ?? '');
				if (key && !(key in fieldErrors)) fieldErrors[key] = issue.message;
			}
			return fail(400, { type: 'error' as const, fieldErrors, email });
		}

		const pb = loadPocketBaseConfig(env);
		try {
			await createUser(pb, parsed.data.email, parsed.data.password);
		} catch (err) {
			if (err instanceof PocketBaseError && err.status === 400) {
				const taken = err.fieldCodes.email === 'validation_not_unique';
				return fail(400, {
					type: 'error' as const,
					fieldErrors: taken ? { email: 'auth.error.emailTaken' } : {},
					formError: taken ? undefined : 'auth.error.signupRejected',
					email: parsed.data.email
				});
			}
			return fail(503, {
				type: 'error' as const,
				fieldErrors: {},
				formError: 'auth.error.unavailable',
				email: parsed.data.email
			});
		}

		// Best-effort: el envío del correo depende de SMTP; no bloquea el registro.
		await requestVerification(pb, parsed.data.email).catch(() => undefined);

		try {
			const session = await authWithPassword(pb, parsed.data.email, parsed.data.password);
			setSessionCookie(cookies, session.token, url.protocol === 'https:');
		} catch {
			throw redirect(303, '/login?registered=1');
		}
		throw redirect(303, safeRedirect(url.searchParams.get('redirectTo')));
	}
};
