import { describe, it, expect } from 'vitest';
import type { ManualItem, MaterialRow } from '$lib/schemas/materials';
import { buildRfqItems } from '$lib/services/rfq-items';

const fileRow = (over: Partial<MaterialRow> = {}): MaterialRow => ({
	name: 'Martillo 16oz',
	qty: 10,
	unit: 'pieces',
	...over
});

const manual = (name: string): ManualItem => ({ id: name, name, qty: 5, unit: 'sets' });

describe('buildRfqItems', () => {
	it('mapea las columnas del archivo al formato canónico del backend', () => {
		const [item] = buildRfqItems(
			[
				fileRow({
					position: 7,
					description: ' acero ',
					'min price': 2,
					'max price': 9,
					brand: 'Stanley',
					'technical specs': ''
				})
			],
			[]
		);
		expect(item).toEqual({
			name: 'Martillo 16oz',
			qty: 10,
			unit: 'pieces',
			position: 7,
			description: 'acero',
			min_price: 2,
			max_price: 9,
			brand: 'Stanley',
			technical_specs: null
		});
	});

	it('conserva las posiciones del archivo si son únicas y no hay ítems manuales', () => {
		const items = buildRfqItems([fileRow({ position: 3 }), fileRow({ name: 'b', position: 9 })], []);
		expect(items.map((i) => i.position)).toEqual([3, 9]);
	});

	it('numera 1..N cuando se mezclan archivo y manuales', () => {
		const items = buildRfqItems([fileRow({ position: 5 })], [manual('Tornillos')]);
		expect(items.map((i) => i.position)).toEqual([1, 2]);
		expect(items[1]).toMatchObject({ name: 'Tornillos', qty: 5, unit: 'sets' });
	});

	it('numera 1..N si faltan posiciones o hay duplicadas', () => {
		expect(buildRfqItems([fileRow(), fileRow({ name: 'b' })], []).map((i) => i.position)).toEqual([1, 2]);
		const dup = buildRfqItems([fileRow({ position: 2 }), fileRow({ name: 'b', position: 2 })], []);
		expect(dup.map((i) => i.position)).toEqual([1, 2]);
	});

	it('sólo manuales: conserva nombre, cantidad y unidad', () => {
		const items = buildRfqItems([], [manual('  Cinta  ')]);
		expect(items).toEqual([{ name: 'Cinta', qty: 5, unit: 'sets', position: 1 }]);
	});
});
