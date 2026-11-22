import { describe, it, expect } from 'vitest';
import { FLAG_CODES } from '$lib/domain/flags';
import { LOCALES, hasMessage, translate, translateFlag, translatePlural } from '$lib/i18n';
import { formatBudget, formatDate, formatNumber, formatScore, formatUsd } from '$lib/i18n/format';
import { en } from '$lib/i18n/locales/en';
import { esVE } from '$lib/i18n/locales/es-VE';

const placeholders = (text: string) =>
	[...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe('diccionarios', () => {
	it('es-VE y en tienen exactamente las mismas claves', () => {
		expect(Object.keys(en).sort()).toEqual(Object.keys(esVE).sort());
	});

	it('cada clave usa los mismos parámetros {x} en ambos idiomas', () => {
		for (const key of Object.keys(esVE) as (keyof typeof esVE)[]) {
			expect(placeholders(en[key]), key).toEqual(placeholders(esVE[key]));
		}
	});

	it('no hay traducciones vacías', () => {
		for (const dict of [esVE, en]) {
			for (const [key, value] of Object.entries(dict)) expect(value.trim(), key).not.toBe('');
		}
	});

	it('las claves con plural traen siempre .one y .other', () => {
		const keys = Object.keys(esVE);
		for (const key of keys.filter((k) => k.endsWith('.one'))) {
			expect(keys, key).toContain(key.replace(/\.one$/, '.other'));
		}
		for (const key of keys.filter((k) => k.endsWith('.other'))) {
			expect(keys, key).toContain(key.replace(/\.other$/, '.one'));
		}
	});

	it('todos los códigos de alerta tienen texto en ambos idiomas', () => {
		for (const code of FLAG_CODES) {
			expect(hasMessage(`flag.${code}`), code).toBe(true);
			for (const locale of LOCALES) {
				expect(translateFlag(locale, { code, params: {} }).length, `${locale}:${code}`).toBeGreaterThan(0);
			}
		}
	});

	it('usa es-VE como idioma por defecto', () => {
		expect(LOCALES[0]).toBe('es-VE');
	});
});

describe('translate', () => {
	it('interpola parámetros y formatea los números según el idioma', () => {
		expect(translate('es-VE', 'table.page', { page: 1, pages: 1200 })).toMatch(/Página 1 de 1\.?200/);
		expect(translate('en', 'table.page', { page: 1, pages: 1200 })).toBe('Page 1 of 1,200');
	});

	it('deja intactos los parámetros de texto', () => {
		expect(translate('es-VE', 'table.budget', { value: '$10,00' })).toBe('Presupuesto $10,00');
	});

	it('selecciona singular y plural con las reglas del idioma', () => {
		expect(translatePlural('es-VE', 'common.items', 1)).toBe('1 ítem');
		expect(translatePlural('es-VE', 'common.items', 5)).toBe('5 ítems');
		expect(translatePlural('en', 'common.items', 1)).toBe('1 item');
		expect(translatePlural('en', 'common.items', 5)).toBe('5 items');
	});

	it('combina plural con parámetros adicionales', () => {
		expect(translatePlural('es-VE', 'topbar.summary', 1, { review: 3 })).toBe('1 ítem · 3 por validar');
		expect(translatePlural('es-VE', 'topbar.summary', 20, { review: 3 })).toBe('20 ítems · 3 por validar');
	});
});

describe('translateFlag', () => {
	it('formatea importes en USD y traduce unidades', () => {
		const price = translateFlag('es-VE', {
			code: 'DQ_PRICE_ABOVE_MAX',
			params: { price: 12.5, max: 10 }
		});
		expect(price).toContain('12,50');
		expect(price).toContain('10,00');

		const unit = translateFlag('es-VE', {
			code: 'W_UNIT_MISMATCH',
			params: { listingUnit: 'pcs', rfqUnit: 'pairs' }
		});
		expect(unit).toContain('piezas');
		expect(unit).toContain('pares');
		expect(translateFlag('en', { code: 'W_UNIT_MISMATCH', params: { listingUnit: 'pcs', rfqUnit: 'pairs' } })).toContain('pieces');
	});

	it('muestra el texto original de los reportes heredados', () => {
		expect(translateFlag('es-VE', { code: 'LEGACY_TEXT', params: { text: 'Texto viejo' } })).toBe('Texto viejo');
	});
});

describe('formatos es-VE', () => {
	it('usa coma decimal y punto de miles', () => {
		expect(formatNumber('es-VE', 1234.5)).toMatch(/^1\.?234,5$/);
		expect(formatNumber('en', 1234.5)).toBe('1,234.5');
	});

	it('puntajes con un decimal fijo', () => {
		expect(formatScore('es-VE', 75)).toBe('75,0');
		expect(formatScore('en', 75)).toBe('75.0');
	});

	it('importes en USD con símbolo $', () => {
		expect(formatUsd('es-VE', 12.5)).toMatch(/\$\s?12,50/);
		expect(formatUsd('en', 12.5)).toBe('$12.50');
	});

	it('rango de presupuesto con extremos disponibles', () => {
		expect(formatBudget('en', 10, 20)).toBe('$10.00–$20.00');
		expect(formatBudget('en', null, 20)).toBe('≤ $20.00');
		expect(formatBudget('en', 10, null)).toBe('≥ $10.00');
		expect(formatBudget('en', null, null)).toBeNull();
	});

	it('fechas ISO localizadas y texto antiguo sin tocar', () => {
		expect(formatDate('es-VE', '2026-11-22')).toMatch(/22.*nov.*2026/i);
		expect(formatDate('en', '2026-11-22')).toMatch(/Nov.*22.*2026/);
		expect(formatDate('es-VE', 'NOV 22, 2026')).toBe('NOV 22, 2026');
	});
});
