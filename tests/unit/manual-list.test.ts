import { describe, it, expect } from 'vitest';
import {
	parseQuantityUnit,
	parseManualEntry,
	tryAddManualItem
} from '$lib/services/manual-list';

describe('parseQuantityUnit', () => {
	it('parsea "200 und"', () => {
		expect(parseQuantityUnit('200 und')).toEqual({ qty: 200, unit: 'pieces' });
	});

	it('parsea miles con coma "1,500 packs"', () => {
		expect(parseQuantityUnit('1,500 packs')).toEqual({ qty: 1500, unit: 'packs' });
	});

	it('parsea sin espacio "10pcs"', () => {
		expect(parseQuantityUnit('10pcs')).toEqual({ qty: 10, unit: 'pieces' });
	});

	it('rechaza decimales', () => {
		expect(parseQuantityUnit('2.5 packs')).toBeNull();
	});

	it('rechaza cantidad 0 o negativa', () => {
		expect(parseQuantityUnit('0 packs')).toBeNull();
		expect(parseQuantityUnit('-3 packs')).toBeNull();
	});

	it('rechaza texto sin unidad', () => {
		expect(parseQuantityUnit('abc')).toBeNull();
		expect(parseQuantityUnit('tornillos 2R')).toBeNull();
	});
});

describe('parseManualEntry', () => {
	it('separa material y cantidad/unidad con la última coma', () => {
		const result = parseManualEntry('Tornillos 3/8, 200 und');
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.name).toBe('Tornillos 3/8');
			expect(result.qty).toBe(200);
			expect(result.unit).toBe('pieces');
		}
	});

	it('conserva el número en el nombre del material', () => {
		const result = parseManualEntry('tornillos 2R');
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.name).toBe('tornillos 2R');
			expect(result.qty).toBe(1);
			expect(result.unit).toBe('pieces');
		}
	});

	it('rechaza entrada vacía', () => {
		const result = parseManualEntry('   ');
		expect(result.ok).toBe(false);
	});
});

describe('tryAddManualItem', () => {
	it('combina material + cantidad/unidad', () => {
		expect(tryAddManualItem('Tornillos 3/8', '200 und')).toEqual({
			ok: true,
			name: 'Tornillos 3/8',
			qty: 200,
			unit: 'pieces'
		});
	});

	it('asume qty 1 / pieces si solo hay material', () => {
		expect(tryAddManualItem('tornillos 2R', '')).toEqual({
			ok: true,
			name: 'tornillos 2R',
			qty: 1,
			unit: 'pieces'
		});
	});

	it('pide el material si solo hay cantidad/unidad', () => {
		expect(tryAddManualItem('', '200 und').ok).toBe(false);
	});

	it('rechaza todo vacío', () => {
		expect(tryAddManualItem('', '').ok).toBe(false);
	});

	it('trata cantidad/unidad inválida como parte del material', () => {
		expect(tryAddManualItem('Clip', '12x')).toEqual({
			ok: true,
			name: 'Clip 12x',
			qty: 1,
			unit: 'pieces'
		});
	});
});
