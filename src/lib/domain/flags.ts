/**
 * Mensajes de dominio (alertas, ventajas y motivos de descalificación).
 *
 * Los módulos de puntaje NO generan texto: emiten un código estable + parámetros, y la
 * interfaz los traduce según el idioma activo. Así la lógica (conteo de señales de calidad,
 * filtros) depende del código y nunca de una frase traducida.
 */
export const FLAG_CODES = [
	// Motivos de descalificación
	'DQ_TRADE_ASSURANCE_REQUIRED',
	'DQ_MIN_YEARS',
	'DQ_MIN_YEARS_UNKNOWN',
	'DQ_PRICE_ABOVE_MAX',
	'DQ_STRICT_MOQ',
	'DQ_STRICT_MOQ_UNCONFIRMED',
	'DQ_MISSING_CERTS',
	'DQ_BELOW_MIN_PRICE_FLOOR',
	// Alertas
	'W_PRICE_NOT_LISTED',
	'W_BAIT_PRICE',
	'W_ABOVE_MEDIAN_PRICE',
	'W_MOQ_UNCONFIRMED',
	'W_MOQ_NEGOTIABLE',
	'W_MOQ_EXCEEDS_QTY',
	'W_UNIT_MISMATCH',
	'W_NO_TRADE_ASSURANCE',
	'W_TENURE_UNKNOWN',
	'W_NEW_SUPPLIER',
	'W_UNVERIFIED_CERTS',
	'W_BRAND_MISMATCH',
	'W_STRICT_BRAND_MISSING',
	'W_BELOW_TARGET_FLOOR',
	'W_NO_CANDIDATES',
	// Ventajas
	'P_PRICE_COMPETITIVE',
	'P_PRICE_BELOW_MEDIAN',
	'P_MOQ_FITS',
	'P_TRADE_ASSURANCE',
	'P_YEARS_ACTIVE',
	'P_CERTS_MATCH',
	'P_COMPLIANCE_BADGES',
	'P_BRAND_MATCH',
	'P_LOW_PRICE_QUOTE',
	// Reportes antiguos (JSON importado con texto libre)
	'LEGACY_TEXT'
] as const;

export type FlagCode = (typeof FLAG_CODES)[number];
export type FlagParams = Record<string, string | number>;

export interface FlagMessage {
	code: FlagCode;
	params?: FlagParams;
}

/** Parámetros numéricos que representan dinero en USD y se formatean como moneda. */
export const CURRENCY_PARAMS: ReadonlySet<string> = new Set(['price', 'min', 'max']);

/** Parámetros de texto que contienen una unidad de medida y se traducen. */
export const UNIT_PARAMS: ReadonlySet<string> = new Set(['unit', 'listingUnit', 'rfqUnit']);

export function flag(code: FlagCode, params?: FlagParams): FlagMessage {
	return params ? { code, params } : { code };
}

export function hasFlagCode(messages: readonly FlagMessage[], ...codes: FlagCode[]): boolean {
	return messages.some((message) => codes.includes(message.code));
}

function isFlagMessage(value: unknown): value is FlagMessage {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as FlagMessage).code === 'string' &&
		(FLAG_CODES as readonly string[]).includes((value as FlagMessage).code)
	);
}

/** Acepta mensajes nuevos y cadenas heredadas (reportes JSON exportados antes del cambio). */
export function normalizeFlags(input: unknown): FlagMessage[] {
	if (!Array.isArray(input)) return [];
	return input.map((item) =>
		isFlagMessage(item) ? item : flag('LEGACY_TEXT', { text: String(item) })
	);
}
