import { describe, it, expect } from 'vitest';
import { loginSchema } from '$lib/schemas/auth';

function messages(input: unknown): string[] {
	const result = loginSchema.safeParse(input);
	return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('loginSchema', () => {
	it('acepta email y contraseña válidos', () => {
		const result = loginSchema.safeParse({ email: 'ana@empresa.com', password: 'secreto1' });
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.email).toBe('ana@empresa.com');
	});

	it('rechaza un email inválido con su clave de traducción', () => {
		expect(messages({ email: 'ana@', password: 'secreto1' })).toEqual(['validation.email.invalid']);
	});

	it('recorta espacios en el email', () => {
		const result = loginSchema.safeParse({ email: '  ana@empresa.com  ', password: 'secreto1' });
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.email).toBe('ana@empresa.com');
	});

	it('rechaza contraseña corta', () => {
		expect(messages({ email: 'ana@empresa.com', password: '123' })).toEqual([
			'validation.password.min'
		]);
	});

	it('rechaza contraseña vacía como obligatoria', () => {
		expect(messages({ email: 'ana@empresa.com', password: '' })).toContain(
			'validation.password.required'
		);
	});

	it('rechaza email vacío como obligatorio', () => {
		expect(messages({ email: '   ', password: 'secreto1' })).toContain(
			'validation.email.required'
		);
	});
});
