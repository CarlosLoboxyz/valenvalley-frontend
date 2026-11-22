import type { MaterialUnit } from '$lib/schemas/materials';
import { normalizeUnit } from './units';

/** `error` es una clave de traducción (`validation.*`). */
export type ManualParseResult =
	| { ok: true; name: string; qty: number; unit: MaterialUnit }
	| { ok: false; name: string; error: string };

/**
 * Resultado del helper `tryAddManualItem`: resuelve material + cantidad/unidad
 * a partir de dos entradas independientes ("material" y "cantidad y unidad").
 */
export type ManualAddResult =
	| { ok: true; name: string; qty: number; unit: MaterialUnit }
	| { ok: false; error: string };

/** Unidades reconocidas en texto libre (formas cortas/pluraladas, sin acentos). */
const UNIT_TOKEN_SOURCE = [
	'und',
	'unid',
	'unidade',
	'unidades',
	'un',
	'u',
	'unit',
	'units',
	'piece',
	'pieces',
	'pcs',
	'pz',
	'pzas',
	'pack',
	'packs',
	'pq',
	'kit',
	'kits',
	'set',
	'sets',
	'pair',
	'pairs'
].join('|');

const NUMBER_SOURCE = '\\d{1,3}(?:[.,]\\d{3})*|\\d+';

const QUANTITY_UNIT_RE = new RegExp(
	`^\\s*(${NUMBER_SOURCE})\\s*(${UNIT_TOKEN_SOURCE})\\b.*$`,
	'i'
);

function parseNumberToken(token: string): number {
	// Acepta separadores de miles con punto o coma, pero no decimales.
	if (/[.,]\d{3}([.,]\d{3})+/.test(token)) return Number.NaN;
	const normalized = token.includes(',') ? token.replace(/,/g, '') : token;
	if (/[.,]\d{2}$/.test(normalized)) return Number.NaN; // decimal como "2.50"
	return Number(normalized);
}

/**
 * Parsea `"200 und"`, `"1,500 packs"`, `"10pcs"`… Devuelve `null` si no se
 * reconoce una cantidad+unidad (p. ej. una frase sin unidad).
 */
export function parseQuantityUnit(raw: string): { qty: number; unit: MaterialUnit } | null {
	const match = QUANTITY_UNIT_RE.exec(raw.trim());
	if (!match) return null;

	const qty = parseNumberToken(match[1]);
	if (Number.isNaN(qty) || qty <= 0) return null;

	const unit = normalizeUnit(match[2]);
	if (!unit) return null;

	return { qty, unit };
}

/**
 * Interpreta una entrada libre:
 *   - `"Tornillos 3/8, 200 und"` -> material + cantidad/unidad.
 *   - `"200 und"` -> solo cantidad/unidad (el material se da por otro campo).
 *   - `"tornillos 2R"` -> material sin cantidad => qty 1, unit pieces (default).
 * La cantidad solo se reconoce cuando va acompañada de una unidad válida.
 */
export function parseManualEntry(raw: string): ManualParseResult {
	const text = raw.trim();
	if (text === '') return { ok: false, name: '', error: 'validation.manual.name' };

	const commaIdx = text.lastIndexOf(',');
	if (commaIdx !== -1) {
		const tail = text.slice(commaIdx + 1);
		const parsed = parseQuantityUnit(tail);
		if (parsed) {
			const name = text.slice(0, commaIdx).trim();
			if (name === '') {
				return { ok: false, name: '', error: 'validation.manual.name' };
			}
			return { ok: true, name, qty: parsed.qty, unit: parsed.unit };
		}
		// Sin coma numérica: el texto íntegro es el nombre del material.
		return { ok: true, name: text, qty: 1, unit: 'pieces' };
	}

	const parsed = parseQuantityUnit(text);
	if (parsed) {
		// Solo cantidad/unidad; el material lo aporta el otro campo.
		return { ok: false, name: '', error: 'validation.manual.name' };
	}

	return { ok: true, name: text, qty: 1, unit: 'pieces' };
}

/**
 * Combina los dos campos de la UI ("Material" y "Cantidad y unidad"):
 *   - nombre + cantidad/unidad -> item válido.
 *   - solo nombre -> qty 1, unit 'pieces'.
 *   - solo cantidad/unidad -> error pidiendo el material.
 */
export function tryAddManualItem(nameRaw: string, qtyUnitRaw: string): ManualAddResult {
	const name = nameRaw.trim();
	const qtyUnit = qtyUnitRaw.trim();

	if (name === '' && qtyUnit === '') {
		return { ok: false, error: 'validation.manual.both' };
	}

	if (name === '') {
		const parsed = parseQuantityUnit(qtyUnit);
		if (parsed) {
			return { ok: false, error: 'validation.manual.name' };
		}
		return { ok: true, name: qtyUnit, qty: 1, unit: 'pieces' };
	}

	if (qtyUnit === '') {
		// Solo material, sin cantidad: default qty 1, unit 'pieces'.
		return { ok: true, name, qty: 1, unit: 'pieces' };
	}

	const parsed = parseQuantityUnit(qtyUnit);
	if (!parsed) {
		// La "cantidad y unidad" no es válida: se trata como material adicional.
		return { ok: true, name: `${name} ${qtyUnit}`, qty: 1, unit: 'pieces' };
	}

	return { ok: true, name, qty: parsed.qty, unit: parsed.unit };
}
