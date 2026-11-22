import { describe, it, expect } from 'vitest';
import { DEFAULT_THEME, readLocale, readTheme } from '$lib/preferences/constants';

describe('preferencias', () => {
	it('el tema por defecto es claro', () => {
		expect(DEFAULT_THEME).toBe('light');
		expect(readTheme(undefined)).toBe('light');
	});

	it('respeta el tema guardado y descarta valores inválidos', () => {
		expect(readTheme('dark')).toBe('dark');
		expect(readTheme('light')).toBe('light');
		expect(readTheme('neon')).toBe('light');
	});

	it('el idioma por defecto es es-VE y se respeta el guardado', () => {
		expect(readLocale(undefined)).toBe('es-VE');
		expect(readLocale('en')).toBe('en');
		expect(readLocale('es-VE')).toBe('es-VE');
		expect(readLocale('fr')).toBe('es-VE');
	});
});
