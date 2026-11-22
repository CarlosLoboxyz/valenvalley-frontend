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

import { signupSchema } from '$lib/schemas/auth';

describe('signupSchema', () => {
	const ok = { email: 'ana@empresa.com', password: 'secreto12', passwordConfirm: 'secreto12' };

	it('acepta datos válidos', () => {
		expect(signupSchema.safeParse(ok).success).toBe(true);
	});

	it('exige 8 caracteres', () => {
		const result = signupSchema.safeParse({ ...ok, password: 'abc123', passwordConfirm: 'abc123' });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((i) => i.message)).toContain('validation.password.minSignup');
		}
	});

	it('exige que las contraseñas coincidan', () => {
		const result = signupSchema.safeParse({ ...ok, passwordConfirm: 'otra-clave' });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe('validation.passwordConfirm.mismatch');
			expect(result.error.issues[0]?.path).toEqual(['passwordConfirm']);
		}
	});
});
