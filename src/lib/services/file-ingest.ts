import * as XLSX from 'xlsx';
import { materialRowSchema, type MaterialRow, type IngestError } from '$lib/schemas/materials';
import { normalizeHeader, resolveHeader, REQUIRED_HEADERS } from './columns';
import { normalizeUnit } from './units';

export interface IngestResult {
	valid: MaterialRow[];
	errors: IngestError[];
	total: number;
}

/** Convierte un valor de celda a número. Rechaza `NaN` e infinitos. */
export function toNumber(value: unknown): number {
	if (typeof value === 'number') return value;
	if (value === null || value === undefined || value === '') return Number.NaN;
	const str = String(value).trim().replace(/[$€,\s]/g, '');
	if (str === '') return Number.NaN;
	return Number(str);
}

function convertUnit(value: unknown): string {
	return typeof value === 'number' ? String(value) : String(value ?? '');
}

/** Lee el valor de una celda por su encabezado canónico. */
function cellFrom(headers: string[], keys: string[], raw: Record<string, unknown>, canonical: string): unknown {
	const idx = headers.indexOf(canonical);
	if (idx === -1) return undefined;
	return raw[keys[idx]];
}

/**
 * Parsea un `.csv` o `.xlsx` (recibido como `ArrayBuffer`). Ninguna fila entra
 * a la UI sin pasar antes por el esquema Zod: las filas inválidas quedan
 * registradas en `errors` con fila, columna, valor y motivo, nunca en silencio.
 */
export function parseMaterialsData(data: ArrayBuffer): IngestResult {
	const wb = XLSX.read(data, { type: 'array', cellDates: false });
	const sheetName = wb.SheetNames[0];
	const sheet = sheetName ? wb.Sheets[sheetName] : undefined;
	if (!sheet) {
		return {
			valid: [],
			errors: [{ row: 1, column: '', value: '', message: 'ingest.emptyFile' }],
			total: 0
		};
	}

	const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

	// Mapeo de encabezados: nombre canónico en el orden de columnas del archivo.
	const rawHeaders = Object.keys(rows[0] ?? {});
	const headers: string[] = [];
	const seen = new Set<string>();
	for (const raw of rawHeaders) {
		const canonical = resolveHeader(normalizeHeader(raw));
		if (canonical && !seen.has(canonical)) {
			headers.push(canonical);
			seen.add(canonical);
		}
	}

	const valid: MaterialRow[] = [];
	const errors: IngestError[] = [];
	rows.forEach((raw, i) => {
		const rowNumber = i + 1; // 1-based: la fila 1 es el encabezado
		const keys = Object.keys(raw);
		const rowErrors: IngestError[] = [];

		for (const required of REQUIRED_HEADERS) {
			if (!headers.includes(required) && rowErrors.length === 0) {
				rowErrors.push({
					row: rowNumber,
					column: required,
					value: '',
					message: 'ingest.missingColumn',
					params: { column: required }
				});
			}
		}

		const qtyValue = toNumber(cellFrom(headers, keys, raw, 'qty'));
		const unitValue = convertUnit(cellFrom(headers, keys, raw, 'unit'));

		const candidate: Record<string, unknown> = {
			name: cellFrom(headers, keys, raw, 'name'),
			qty: qtyValue,
			unit: normalizeUnit(unitValue) ?? unitValue
		};

		// Campos opcionales: solo se incluyen si la columna existe.
		const position = toNumber(cellFrom(headers, keys, raw, 'position'));
		if (!Number.isNaN(position)) candidate.position = position;
		const minPrice = toNumber(cellFrom(headers, keys, raw, 'min price'));
		if (!Number.isNaN(minPrice)) candidate['min price'] = minPrice;
		const maxPrice = toNumber(cellFrom(headers, keys, raw, 'max price'));
		if (!Number.isNaN(maxPrice)) candidate['max price'] = maxPrice;
		const description = cellFrom(headers, keys, raw, 'description');
		if (description !== undefined && description !== '') candidate.description = description;
		const brand = cellFrom(headers, keys, raw, 'brand');
		if (brand !== undefined && brand !== '') candidate.brand = brand;
		const specs = cellFrom(headers, keys, raw, 'technical specs');
		if (specs !== undefined && specs !== '') candidate['technical specs'] = specs;

		if (rowErrors.length === 0) {
			const parsed = materialRowSchema.safeParse(candidate);
			if (parsed.success) {
				valid.push(parsed.data);
				return;
			}
			for (const issue of parsed.error.issues) {
				const column = String(issue.path[0] ?? '');
				const valueRaw = column ? cellFrom(headers, keys, raw, column) : undefined;
				rowErrors.push({
					row: rowNumber,
					column,
					value: String(valueRaw ?? ''),
					message: issue.message
				});
			}
		}

		errors.push(...rowErrors);
	});

	return { valid, errors, total: rows.length };
}

/** Predicado de conveniencia para la UI: ¿se cargó al menos una fila válida? */
export function hasValidRows(result: IngestResult): boolean {
	return result.valid.length > 0;
}
