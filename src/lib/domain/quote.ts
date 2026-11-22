import type { RecommendationItem, PriceTier } from '$lib/types/sourcing';

/*
 * Cálculo de la cotización con enteros (céntimos) para que los totales cuadren exactamente,
 * sin los errores de redondeo de la aritmética en punto flotante.
 */

/** Convertir una cantidad de USD a céntimos enteros. */
export function dollarsToCents(amount: number): number {
	return Math.round(amount * 100);
}

/** Subtotal en céntimos: cantidad entera × precio unitario en USD. */
export function subtotalCents(qty: number, unitPriceUsd: number): number {
	return Math.round(qty * dollarsToCents(unitPriceUsd));
}

/** Precio unitario definido en una lista de tramos, según la cantidad pedida. */
export interface ResolvedPrice {
	unitPriceUsd: number | null;
	/** Solo hay rango (sin tramo aplicable), p. ej. un hueco entre tramos. */
	priceRange: boolean;
	/** La cantidad quedó por debajo del primer tramo (equivale a MOQ excedido). */
	belowTiers: boolean;
	/** Extremos del rango cuando `priceRange` es true (no seteados en el resto de casos). */
	gapLow?: number;
	gapHigh?: number;
}

/**
 * Elige el tramo de precio aplicable a la cantidad pedida.
 * - `min_qty <= qty <= max_qty` (o sin tope) → precio puntual.
 * - Cantidad por debajo del primer tramo → precio del primer tramo + `belowTiers`.
 * - Hueco entre tramos → rango con los precios de los tramos que lo rodean.
 */
export function resolveTierPrice(tiers: readonly PriceTier[], qty: number): ResolvedPrice {
	const sorted = [...tiers].sort((a, b) => a.min_qty - b.min_qty);
	if (sorted.length === 0) return { unitPriceUsd: null, priceRange: false, belowTiers: false };

	const inTier = sorted.find(
		(tier) => qty >= tier.min_qty && (tier.max_qty === null || qty <= tier.max_qty)
	);
	if (inTier) {
		return { unitPriceUsd: inTier.unit_price_usd, priceRange: false, belowTiers: false };
	}

	const firstTier = sorted[0];
	const lastTier = sorted[sorted.length - 1];

	if (qty < firstTier.min_qty) {
		return { unitPriceUsd: firstTier.unit_price_usd, priceRange: false, belowTiers: true };
	}

	if (lastTier.max_qty === null || qty > lastTier.max_qty) {
		return { unitPriceUsd: lastTier.unit_price_usd, priceRange: false, belowTiers: false };
	}

	// Hueco entre tramos: no hay un precio aplicable, se expone el rango circundante.
	const floorTiers = sorted.filter((tier) => tier.max_qty !== null && qty > tier.max_qty);
	const ceilingTier = sorted.find((tier) => qty < tier.min_qty);
	if (floorTiers.length > 0 && ceilingTier) {
		return {
			unitPriceUsd: null,
			priceRange: true,
			belowTiers: false,
			gapLow: Math.max(...floorTiers.map((tier) => tier.unit_price_usd)),
			gapHigh: ceilingTier.unit_price_usd
		};
	}

	return { unitPriceUsd: lastTier.unit_price_usd, priceRange: false, belowTiers: false };
}

export type QuoteStatus =
	| 'quoted'
	| 'noPrice'
	| 'missingVolume'
	| 'unitMismatch'
	| 'disqualified';

export interface ItemQuote {
	pos: number;
	status: QuoteStatus;
	unitPriceUsd: number | null;
	subtotalCentsMin: number;
	subtotalCentsMax: number;
	/** Volumen en m³ para la cantidad pedida; `null` si no hay dato. */
	volumeM3: number | null;
	weightKg: number | null;
	includesPackaging: boolean | null;
	priceRange: boolean;
	moqExceeded: boolean;
}

function hasIndicator(item: RecommendationItem, code: string): boolean {
	return item.warnings.some((warning) => warning.code === code);
}

/** Volumen para la cantidad pedida: el total manda; si no, el unitario × cantidad. */
function resolveVolume(item: RecommendationItem): number | null {
	if (item.cargoVolumeM3 != null) return item.cargoVolumeM3;
	if (item.unitVolumeM3 != null) return item.unitVolumeM3 * item.qtyNumeric;
	return null;
}

export function quoteItem(item: RecommendationItem): ItemQuote {
	const qty = item.qtyNumeric;

	if (!item.supplier || item.tier === 'Disqualified') {
		return {
			pos: item.pos,
			status: 'disqualified',
			unitPriceUsd: null,
			subtotalCentsMin: 0,
			subtotalCentsMax: 0,
			volumeM3: null,
			weightKg: null,
			includesPackaging: item.includesPackaging,
			priceRange: false,
			moqExceeded: item.moqNumeric != null && item.moqNumeric > qty
		};
	}

	const unitMismatch = hasIndicator(item, 'W_UNIT_MISMATCH');
	const moqExceeded = item.moqNumeric != null && item.moqNumeric > qty;
	const volumeM3 = resolveVolume(item);

	// Precio: tramos primero; si no, rango; si no, sin precio.
	let minUnit: number | null = null;
	let maxUnit: number | null = null;
	let unitPriceUsd: number | null = null;
	let priceRange = false;
	let belowTiers = false;

	if (item.priceTiers && item.priceTiers.length > 0) {
		const resolved = resolveTierPrice(item.priceTiers, qty);
		belowTiers = resolved.belowTiers;
		priceRange = resolved.priceRange;
		if (resolved.unitPriceUsd != null) {
			minUnit = resolved.unitPriceUsd;
			maxUnit = resolved.unitPriceUsd;
			unitPriceUsd = resolved.unitPriceUsd;
		} else if (resolved.gapLow != null && resolved.gapHigh != null) {
			minUnit = resolved.gapLow;
			maxUnit = resolved.gapHigh;
		}
	} else if (item.unitPriceMinUsd != null) {
		minUnit = item.unitPriceMinUsd;
		maxUnit = item.unitPriceMaxUsd ?? item.unitPriceMinUsd;
		if (item.unitPriceMaxUsd != null && item.unitPriceMaxUsd !== item.unitPriceMinUsd) {
			priceRange = true;
		}
	}

	if (minUnit == null || maxUnit == null) {
		return {
			pos: item.pos,
			status: 'noPrice',
			unitPriceUsd: null,
			subtotalCentsMin: 0,
			subtotalCentsMax: 0,
			volumeM3,
			weightKg: item.cargoWeightKg,
			includesPackaging: item.includesPackaging,
			priceRange,
			moqExceeded: moqExceeded || belowTiers
		};
	}

	const subtotalMin = subtotalCents(qty, minUnit);
	const subtotalMax = subtotalCents(qty, maxUnit);

	let status: QuoteStatus = 'quoted';
	if (unitMismatch) status = 'unitMismatch';
	else if (volumeM3 == null) status = 'missingVolume';

	return {
		pos: item.pos,
		status,
		unitPriceUsd,
		subtotalCentsMin: Math.min(subtotalMin, subtotalMax),
		subtotalCentsMax: Math.max(subtotalMin, subtotalMax),
		volumeM3,
		weightKg: item.cargoWeightKg,
		includesPackaging: item.includesPackaging,
		priceRange,
		moqExceeded: moqExceeded || belowTiers
	};
}

export interface QuoteSummary {
	totalCentsMin: number;
	totalCentsMax: number;
	volumeSumM3: number;
	weightSumKg: number;
	/** Ítems con precio (aunque les falte volumen). */
	pricedCount: number;
	/** Ítems incluidos en el total (con precio y sin descuadre de unidad). */
	quotedCount: number;
	noPriceCount: number;
	unitMismatchCount: number;
	disqualifiedCount: number;
	priceRangeCount: number;
	moqExceededCount: number;
	volumeKnownCount: number;
	packagingExcludedCount: number;
}

/** Total en céntimos → dólares listos para formatear. */
export function centsToDollars(cents: number): number {
	return cents / 100;
}

export function summarizeQuotes(items: readonly RecommendationItem[]): QuoteSummary {
	const quotes = items.map(quoteItem);

	const totalCentsMin = quotes.reduce((acc, q) => acc + q.subtotalCentsMin, 0);
	const totalCentsMax = quotes.reduce((acc, q) => acc + q.subtotalCentsMax, 0);

	let volumeSum = 0;
	let weightSum = 0;
	let volumeKnown = 0;
	let packagingExcluded = 0;
	for (const quote of quotes) {
		if (quote.volumeM3 != null) {
			volumeSum += quote.volumeM3;
			volumeKnown++;
		}
		if (quote.weightKg != null) weightSum += quote.weightKg;
		if (quote.includesPackaging === false) packagingExcluded++;
	}

	const priced = quotes.filter((q) => q.subtotalCentsMax > 0 || q.status === 'quoted');

	return {
		totalCentsMin,
		totalCentsMax,
		volumeSumM3: volumeSum,
		weightSumKg: weightSum,
		pricedCount: priced.length,
		quotedCount: quotes.filter((q) => q.status === 'quoted').length,
		noPriceCount: quotes.filter((q) => q.status === 'noPrice').length,
		unitMismatchCount: quotes.filter((q) => q.status === 'unitMismatch').length,
		disqualifiedCount: quotes.filter((q) => q.status === 'disqualified').length,
		priceRangeCount: quotes.filter((q) => q.priceRange).length,
		moqExceededCount: quotes.filter((q) => q.moqExceeded).length,
		volumeKnownCount: volumeKnown,
		packagingExcludedCount: packagingExcluded
	};
}
