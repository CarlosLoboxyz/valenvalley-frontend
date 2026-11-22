import type { MaterialUnit } from '$lib/schemas/materials';

/**
 * Normaliza una unidad escrita por el usuario al enum canónico.
 * `und`, `unidad`, `unit`, `u.` y singulares/plurales equivalen a sus versiones
 * canónicas. Devuelve `null` si la unidad no se reconoce.
 */
const UNIT_ALIASES: Record<string, MaterialUnit> = {
	// pieces
	pieces: 'pieces',
	piece: 'pieces',
	pcs: 'pieces',
	pz: 'pieces',
	pzas: 'pieces',
	pieza: 'pieces',
	piezas: 'pieces',
	und: 'pieces',
	un: 'pieces',
	unidad: 'pieces',
	unidades: 'pieces',
	unit: 'pieces',
	units: 'pieces',
	u: 'pieces',
	// packs
	packs: 'packs',
	pack: 'packs',
	pq: 'packs',
	paquete: 'packs',
	paquetes: 'packs',
	// kits
	kits: 'kits',
	kit: 'kits',
	// sets
	sets: 'sets',
	set: 'sets',
	juego: 'sets',
	juegos: 'sets',
	// pairs
	pairs: 'pairs',
	pair: 'pairs',
	par: 'pairs',
	pares: 'pairs'
};

export function normalizeUnit(raw: string): MaterialUnit | null {
	const key = raw.replace(/\s+/g, ' ').trim().toLowerCase();
	return UNIT_ALIASES[key] ?? null;
}
