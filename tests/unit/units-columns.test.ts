import { describe, it, expect } from 'vitest';
import { normalizeHeader, resolveHeader, REQUIRED_HEADERS } from '$lib/services/columns';
import { normalizeUnit } from '$lib/services/units';

describe('normalizeHeader', () => {
	it('limpia espacios laterales y colapsa internos', () => {
		expect(normalizeHeader('   max price   ')).toBe('max price');
		expect(normalizeHeader(' max  price ')).toBe('max price');
	});

	it('pasa a minúsculas', () => {
		expect(normalizeHeader('  MAX PRICE ')).toBe('max price');
	});
});

describe('resolveHeader', () => {
	it('resuelve aliases a columnas canónicas', () => {
		expect(resolveHeader(normalizeHeader('Product Name'))).toBe('name');
		expect(resolveHeader(normalizeHeader('qty'))).toBe('qty');
		expect(resolveHeader(normalizeHeader('cantidad'))).toBe('qty');
	});

	it('devuelve null para columnas desconocidas', () => {
		expect(resolveHeader('pais')).toBeNull();
	});

	it('expone los encabezados obligatorios', () => {
		expect(REQUIRED_HEADERS).toEqual(['name', 'qty', 'unit']);
	});
});

describe('normalizeUnit', () => {
	it('normaliza formas cortas y plurales a pieces', () => {
		expect(normalizeUnit('und')).toBe('pieces');
		expect(normalizeUnit('unidad')).toBe('pieces');
		expect(normalizeUnit('pcs')).toBe('pieces');
		expect(normalizeUnit('pieces')).toBe('pieces');
	});

	it('conserva unidades canónicas', () => {
		expect(normalizeUnit('packs')).toBe('packs');
		expect(normalizeUnit('kits')).toBe('kits');
		expect(normalizeUnit('sets')).toBe('sets');
		expect(normalizeUnit('PAIRS')).toBe('pairs');
	});

	it('rechaza unidades desconocidas', () => {
		expect(normalizeUnit('galones')).toBeNull();
		expect(normalizeUnit('')).toBeNull();
	});
});
