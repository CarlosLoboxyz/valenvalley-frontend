import { z } from 'zod';

/**
 * Esquema del formulario de Login.
 *
 * Los mensajes son CLAVES de traducción (`validation.*`): el esquema no sabe en qué idioma
 * está la interfaz y la vista las traduce con `prefs.msg()`.
 * La verificación real de credenciales se reemplaza en un hito posterior (la action solo
 * normaliza y redirige).
 */
export const loginSchema = z.object({
	email: z
		.string({ message: 'validation.email.required' })
		.trim()
		.min(1, 'validation.email.required')
		.email('validation.email.invalid'),
	password: z
		.string({ message: 'validation.password.required' })
		.min(1, 'validation.password.required')
		.min(6, 'validation.password.min')
});

export type LoginInput = z.input<typeof loginSchema>;
export type LoginData = z.output<typeof loginSchema>;

/** Resultado de la action de login ante errores de validación (valores = claves de traducción). */
export interface LoginFieldErrors {
	type: 'error';
	fieldErrors: Record<string, string | undefined>;
}
