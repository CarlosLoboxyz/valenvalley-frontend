import { z } from 'zod';

/**
 * Esquemas de los formularios de acceso (login y registro).
 *
 * Los mensajes son CLAVES de traducción (`validation.*`): el esquema no sabe en qué idioma
 * está la interfaz y la vista las traduce con `prefs.msg()`.
 * Las credenciales las verifica PocketBase en el servidor (ver `routes/login`).
 */
const email = z
	.string({ message: 'validation.email.required' })
	.trim()
	.min(1, 'validation.email.required')
	.email('validation.email.invalid');

export const loginSchema = z.object({
	email,
	password: z
		.string({ message: 'validation.password.required' })
		.min(1, 'validation.password.required')
		.min(6, 'validation.password.min')
});

/** PocketBase exige 8 caracteres como mínimo en la colección `users` por defecto. */
export const SIGNUP_MIN_PASSWORD = 8;

export const signupSchema = z
	.object({
		email,
		password: z
			.string({ message: 'validation.password.required' })
			.min(1, 'validation.password.required')
			.min(SIGNUP_MIN_PASSWORD, 'validation.password.minSignup'),
		passwordConfirm: z.string({ message: 'validation.passwordConfirm.mismatch' })
	})
	.refine((data) => data.password === data.passwordConfirm, {
		path: ['passwordConfirm'],
		message: 'validation.passwordConfirm.mismatch'
	});

export type LoginInput = z.input<typeof loginSchema>;
export type LoginData = z.output<typeof loginSchema>;
export type SignupData = z.output<typeof signupSchema>;

/**
 * Resultado de las actions de login/registro ante errores (valores = claves de traducción).
 * `formError` es un error global (credenciales inválidas, PocketBase caído…); `email` se
 * devuelve para repoblar el campo.
 */
export interface LoginFieldErrors {
	type: 'error';
	fieldErrors: Record<string, string | undefined>;
	formError?: string;
	email?: string;
}

