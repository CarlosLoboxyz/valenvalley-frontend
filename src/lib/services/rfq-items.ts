import type { ManualItem, MaterialRow } from '$lib/schemas/materials';
import type { RfqItemInput } from '$lib/services/backend/types';

/** Límite del backend (`POST /rfq/items`). */
export const MAX_RFQ_ITEMS = 5000;

function clean(value: string | undefined): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

/**
 * Une las filas del archivo y las manuales en la lista canónica que espera el backend.
 * Las posiciones sólo se conservan si vienen todas del archivo y son únicas; en cualquier otro
 * caso se numera de 1..N para evitar duplicados.
 */
export function buildRfqItems(fileRows: MaterialRow[], manual: ManualItem[]): RfqItemInput[] {
	const fromFile: RfqItemInput[] = fileRows.map((row) => ({
		name: row.name,
		qty: row.qty,
		unit: row.unit,
		position: row.position ?? null,
		description: clean(row.description),
		min_price: row['min price'] ?? null,
		max_price: row['max price'] ?? null,
		brand: clean(row.brand),
		technical_specs: clean(row['technical specs'])
	}));
	const fromManual: RfqItemInput[] = manual.map((item) => ({
		name: item.name.trim(),
		qty: item.qty,
		unit: item.unit
	}));

	const items = [...fromFile, ...fromManual];
	const positions = fromFile.map((item) => item.position);
	const keepPositions =
		fromManual.length === 0 &&
		positions.every((p) => typeof p === 'number') &&
		new Set(positions).size === positions.length;

	return items.map((item, index) => ({
		...item,
		position: keepPositions ? item.position : index + 1
	}));
}
