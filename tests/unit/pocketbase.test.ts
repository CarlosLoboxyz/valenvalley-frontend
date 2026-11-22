import { describe, it, expect, vi } from 'vitest';
import {
	authRefresh,
	authWithPassword,
	createUser,
	loadPocketBaseConfig,
	PocketBaseError,
	tokenExpiry
} from '$lib/services/pocketbase';
import { isPublicPath, safeRedirect } from '$lib/server/session';

const config = loadPocketBaseConfig({ POCKETBASE_URL: 'http://pb:8090/' });

function jwt(payload: Record<string, unknown>): string {
	const enc = (o: unknown) =>
		btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	return `${enc({ alg: 'HS256' })}.${enc(payload)}.sig`;
}

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

describe('loadPocketBaseConfig', () => {
	it('normaliza la URL y aplica valores por defecto', () => {
		expect(config.baseUrl).toBe('http://pb:8090');
		expect(config.collection).toBe('users');
		expect(config.timeoutMs).toBe(8000);
	});

	it('lee timeout y colección del entorno', () => {
		const custom = loadPocketBaseConfig({
			POCKETBASE_TIMEOUT_MS: '1500',
			POCKETBASE_USERS_COLLECTION: 'people'
		});
		expect(custom.timeoutMs).toBe(1500);
		expect(custom.collection).toBe('people');
		expect(custom.baseUrl).toBe('http://localhost:8090');
	});
});

describe('authWithPassword', () => {
	it('devuelve token y usuario', async () => {
		const fetchMock = vi.fn(async () =>
			jsonResponse({ token: 't1', record: { id: 'u1', email: 'a@b.co', verified: true } })
		);
		const session = await authWithPassword(config, 'a@b.co', 'secret123', fetchMock as never);
		expect(session).toEqual({
			token: 't1',
			user: { id: 'u1', email: 'a@b.co', verified: true, name: undefined }
		});
		const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('http://pb:8090/api/collections/users/auth-with-password');
		expect(JSON.parse(init.body as string)).toEqual({ identity: 'a@b.co', password: 'secret123' });
	});

	it('propaga credenciales inválidas como PocketBaseError 400', async () => {
		const fetchMock = vi.fn(async () => jsonResponse({ message: 'Failed to authenticate.' }, 400));
		await expect(authWithPassword(config, 'a@b.co', 'x', fetchMock as never)).rejects.toMatchObject({
			status: 400
		});
	});

	it('status 0 cuando PocketBase no responde', async () => {
		const fetchMock = vi.fn(async () => {
			throw new Error('ECONNREFUSED');
		});
		const err = await authWithPassword(config, 'a@b.co', 'x', fetchMock as never).catch((e) => e);
		expect(err).toBeInstanceOf(PocketBaseError);
		expect(err.status).toBe(0);
	});

	it('rechaza una respuesta sin token', async () => {
		const fetchMock = vi.fn(async () => jsonResponse({ record: { id: 'u1' } }));
		await expect(authWithPassword(config, 'a@b.co', 'x', fetchMock as never)).rejects.toMatchObject({
			status: 502
		});
	});
});

describe('authRefresh', () => {
	it('envía el token como Bearer', async () => {
		const fetchMock = vi.fn(async () =>
			jsonResponse({ token: 't2', record: { id: 'u1', email: 'a@b.co', verified: false } })
		);
		const session = await authRefresh(config, 't1', fetchMock as never);
		expect(session.token).toBe('t2');
		const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
		expect((init.headers as Record<string, string>).Authorization).toBe('Bearer t1');
	});
});

describe('createUser', () => {
	it('expone los códigos de validación por campo', async () => {
		const fetchMock = vi.fn(async () =>
			jsonResponse(
				{ message: 'Failed to create record.', data: { email: { code: 'validation_not_unique' } } },
				400
			)
		);
		const err = await createUser(config, 'a@b.co', 'secret123', fetchMock as never).catch((e) => e);
		expect(err.status).toBe(400);
		expect(err.fieldCodes).toEqual({ email: 'validation_not_unique' });
	});

	it('envía passwordConfirm igual a password', async () => {
		const fetchMock = vi.fn(async () => jsonResponse({ id: 'u1' }));
		await createUser(config, 'a@b.co', 'secret123', fetchMock as never);
		const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
		expect(JSON.parse(init.body as string)).toMatchObject({
			email: 'a@b.co',
			password: 'secret123',
			passwordConfirm: 'secret123'
		});
	});
});

describe('tokenExpiry', () => {
	it('lee exp del JWT', () => {
		expect(tokenExpiry(jwt({ exp: 1900000000 }))).toBe(1900000000);
	});

	it('devuelve null si no es un JWT legible', () => {
		expect(tokenExpiry('nope')).toBeNull();
		expect(tokenExpiry('a.@@@.c')).toBeNull();
		expect(tokenExpiry(jwt({ id: 'x' }))).toBeNull();
	});
});

describe('session helpers', () => {
	it('sólo permite redirecciones internas', () => {
		expect(safeRedirect('/materiales?x=1')).toBe('/materiales?x=1');
		expect(safeRedirect('//evil.com')).toBe('/materiales');
		expect(safeRedirect('https://evil.com')).toBe('/materiales');
		expect(safeRedirect('/\\evil.com')).toBe('/materiales');
		expect(safeRedirect(null)).toBe('/materiales');
		expect(safeRedirect(undefined, '/')).toBe('/');
	});

	it('define las rutas públicas', () => {
		expect(isPublicPath('/login')).toBe(true);
		expect(isPublicPath('/signup')).toBe(true);
		expect(isPublicPath('/logout')).toBe(true);
		expect(isPublicPath('/loginx')).toBe(false);
		expect(isPublicPath('/materiales')).toBe(false);
		expect(isPublicPath('/api/backend/score')).toBe(false);
	});
});
