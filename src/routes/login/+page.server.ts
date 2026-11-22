import { redirect } from '@sveltejs/kit';
import { loginSchema } from '$lib/schemas/auth';
import type { Actions } from './$types';

const SESSION_COOKIE = 'cuadramas_session';

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
			return { type: 'error' as const, fieldErrors };
		}

		// Sesión simulada: fácil de reemplazar por autenticación real.
		const session = {
			email: parsed.data.email,
			createdAt: Date.now()
		};
		cookies.set(SESSION_COOKIE, JSON.stringify(session), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 8 // 8 h
		});

		throw redirect(303, url.searchParams.get('redirectTo') ?? '/materiales');
	}
};
