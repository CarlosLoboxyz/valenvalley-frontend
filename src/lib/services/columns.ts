/**
 * Normalización de encabezados de columnas para `.csv` / `.xlsx`.
 * Reglas (AGENTS.md): recortar espacios laterales (`' max price'`), pasar a
 * minúsculas y colapsar espacios internos repetidos.
 */
export function normalizeHeader(raw: string): string {
	return raw.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Aliases de columnas hacia los nombres canónicos usados por los esquemas.
 */
const HEADER_ALIASES: Record<string, string[]> = {
	name: ['name', 'product', 'item', 'material', 'product name', 'nombre', 'producto'],
	qty: ['qty', 'quantity', 'units', 'cantidad', 'amount'],
	unit: ['unit', 'unidad', 'uom', 'medida'],
	position: ['position', 'pos', 'posicion', 'no', 'no.'],
	description: ['description', 'desc', 'descripcion', 'detalle'],
	'min price': ['min price', 'min', 'minimum price', 'precio min', 'precio minimo'],
	'max price': ['max price', 'max', 'maximum price', 'precio max', 'precio maximo'],
	brand: ['brand', 'marca'],
	'technical specs': ['technical specs', 'specs', 'technical specifications', 'specifications', 'especificaciones']
};

const ALIAS_TO_CANONICAL: Record<string, string> = {};
for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
	for (const alias of aliases) {
		ALIAS_TO_CANONICAL[normalizeHeader(alias)] = canonical;
	}
}

/** Mapea un encabezado normalizado a su nombre canónico, o `null` si no se reconoce. */
export function resolveHeader(normalizedHeader: string): string | null {
	return ALIAS_TO_CANONICAL[normalizedHeader] ?? null;
}

/** Encabezados canónicos que son obligatorios para una fila válida. */
export const REQUIRED_HEADERS = ['name', 'qty', 'unit'] as const;
