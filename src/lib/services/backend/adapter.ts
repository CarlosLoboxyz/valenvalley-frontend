import { flag, type FlagMessage } from '$lib/domain/flags';
import { MOQ_UNCONFIRMED, SOURCE_CONSOLIDATED } from '$lib/domain/labels';
import type {
	AlibabaListing,
	CrossItemVendor,
	FamilyScrapeCache,
	PipelineConfig,
	ProductFamily,
	RecommendationItem,
	RecommendationTier,
	RfqItem,
	ScoreBreakdown,
	ScoredVendorOffer,
	SourcingReport
} from '$lib/types/sourcing';
import { formatBudgetRange } from '$lib/utils/format';
import type {
	DeliverablePayload,
	DisqualifiedPayload,
	FamilySearchPlanPayload,
	VendorPayload
} from './types';

/** Mapea las alertas/ventajas/motivos en texto del backend a códigos de dominio del frontend. */
function matchFlag(text: string): FlagMessage {
	const t = text.toLowerCase();
	// Descalificados
	if (t.includes('missing required trade assurance')) return flag('DQ_TRADE_ASSURANCE_REQUIRED');
	if (t.includes('years active') && t.includes('below')) return flag('DQ_MIN_YEARS');
	if (t.includes('exceeds max budget')) return flag('DQ_PRICE_ABOVE_MAX');
	if (t.includes('moq') && t.includes('exceeds strict')) return flag('DQ_STRICT_MOQ');
	if (t.includes('missing required certifications')) return flag('DQ_MISSING_CERTS');
	if (t.includes('below strict min price')) return flag('DQ_BELOW_MIN_PRICE_FLOOR');
	// Alertas
	if (t.includes('price not listed')) return flag('W_PRICE_NOT_LISTED');
	if (t.includes('suspiciously low price')) return flag('W_BAIT_PRICE');
	if (t.includes('moq not listed') || t.includes('moq not confirmed')) return flag('W_MOQ_UNCONFIRMED');
	if (t.includes('moq') && t.includes('far above')) return flag('W_MOQ_EXCEEDS_QTY');
	if (t.includes('moq') && t.includes('slightly above')) return flag('W_MOQ_NEGOTIABLE');
	if (t.includes('no trade assurance')) return flag('W_NO_TRADE_ASSURANCE');
	if (t.includes('tenure')) return flag('W_TENURE_UNKNOWN');
	if (t.includes('new supplier')) return flag('W_NEW_SUPPLIER');
	if (t.includes('unit mismatch')) return flag('W_UNIT_MISMATCH');
	if (t.includes('below target floor') || t.includes('below strict min price')) {
		return flag('W_BELOW_TARGET_FLOOR');
	}
	if (t.includes('brand') && t.includes('not found')) return flag('W_STRICT_BRAND_MISSING');
	if (t.includes('alternative') || t.includes('oem')) return flag('W_BRAND_MISMATCH');
	if (t.includes('certs') && t.includes('missing')) return flag('W_UNVERIFIED_CERTS');
	// Ventajas
	if (t.includes('competitive pricing')) return flag('P_PRICE_COMPETITIVE');
	if (t.includes('fits target order') || t.includes('low moq')) return flag('P_MOQ_FITS');
	if (t.includes('trade assurance protected')) return flag('P_TRADE_ASSURANCE');
	if (t.includes('established supplier')) return flag('P_YEARS_ACTIVE');
	if (t.includes('matches certs')) return flag('P_CERTS_MATCH');
	if (t.includes('certifications/badges')) return flag('P_COMPLIANCE_BADGES');
	if (t.includes('matches requested brand')) return flag('P_BRAND_MATCH');
	// Sin coincidencia: se conserva el texto original, traducible por LEGACY_TEXT.
	return flag('LEGACY_TEXT', { text });
}

const tier = (value: string): RecommendationTier =>
	value === 'Strong Recommend' || value === 'Consider' ? value : 'Caution';

function toListing(vendor: VendorPayload): AlibabaListing {
	const offer = vendor.best_offer;
	return {
		title: offer.title,
		price: offer.price_raw ?? '',
		priceMin: offer.price_min,
		priceMax: offer.price_max,
		moq: offer.moq,
		moqUnit: offer.moq_unit,
		supplier: vendor.supplier,
		supplierId: vendor.supplier_id ?? '',
		yearsActive: vendor.years_active,
		certifications: vendor.certifications,
		hasTradeAssurance: vendor.has_trade_assurance,
		url: offer.url ?? ''
	};
}

function toBreakdown(vendor: VendorPayload): ScoreBreakdown {
	const b = vendor.score_breakdown;
	return {
		price: b.price,
		moqFit: b.moq,
		tradeAssurance: b.trade_assurance,
		yearsActive: b.years_active,
		certifications: b.certifications,
		vendorScore: vendor.vendor_score,
		rfqFitScore: vendor.rfq_fit_score,
		finalScore: vendor.total_score
	};
}

function toOffer(vendor: VendorPayload): ScoredVendorOffer {
	return {
		supplier: vendor.supplier,
		supplierId: vendor.supplier_id ?? '',
		listing: toListing(vendor),
		tier: tier(vendor.recommendation),
		breakdown: toBreakdown(vendor),
		pros: vendor.pros.map(matchFlag),
		warnings: vendor.warnings.map(matchFlag),
		disqualificationReasons: [],
		isBaitPrice: false,
		unitMismatch: vendor.warnings.some((w) => w.toLowerCase().includes('unit mismatch'))
	};
}

function moqLabel(vendor: VendorPayload): string {
	const moq = vendor.best_offer.moq;
	return moq === null ? MOQ_UNCONFIRMED : `${moq} ${vendor.best_offer.moq_unit || 'pcs'}`;
}

const qtyLabel = (qty: number, unit: string): string => `${qty} ${unit}`;

/**
 * Convierte el "4-tab deliverable" del backend (`/recommendations/score` o `/latest`)
 * al modelo `SourcingReport` del frontend. Los campos que el backend aún no expone
 * (volumen, peso, tramos de precio) se dejan `null` sin inventar datos.
 */
export function adaptScoreResponse(
	response: DeliverablePayload,
	config: PipelineConfig
): SourcingReport {
	const meta = response.meta;

	const families: ProductFamily[] = response.family_search_plan.map(planFamily);

	const rfqItems: RfqItem[] = response.recommendations.map((rec) => ({
		position: rec.position,
		name: rec.name,
		description: '',
		unit: rec.unit,
		normalizedUnit: rec.unit.toLowerCase(),
		qty: rec.qty,
		qtyLabel: qtyLabel(rec.qty, rec.unit),
		minPrice: rec.min_price,
		maxPrice: rec.max_price,
		budgetLabel: formatBudgetRange(rec.min_price, rec.max_price),
		brand: rec.brand,
		flexibleBrand: false,
		technicalSpecs: {},
		requiredCerts: rec.required_certs_applied
	}));

	const recommendations: RecommendationItem[] = response.recommendations.map((rec) => {
		const top = rec.vendors[0];
		const offers = rec.vendors.map(toOffer);
		const disqualifiedCount = response.disqualified.filter((d) => d.position === rec.position).length;

		if (!top) {
			return {
				pos: rec.position,
				family: rec.family_id,
				familyName: rec.family_name,
				product: rec.name,
				qty: qtyLabel(rec.qty, rec.unit),
				qtyNumeric: rec.qty,
				unit: rec.unit,
				budget: formatBudgetRange(rec.min_price, rec.max_price),
				minPrice: rec.min_price,
				maxPrice: rec.max_price,
				brand: rec.brand,
				score: 0,
				tier: 'Disqualified',
				supplier: '',
				supplierId: '',
				price: '—',
				issues: 0,
				vendors: rec.vendors.length,
				breakdown: {
					price: 0,
					moqFit: 0,
					tradeAssurance: 0,
					yearsActive: 0,
					certifications: 0,
					vendorScore: 0,
					rfqFitScore: 0,
					finalScore: 0
				},
				pros: [],
				warnings: [flag('W_NO_CANDIDATES')],
				alternatives: offers,
				disqualifiedCount,
				listingUrl: '',
				moqLabel: 'N/A',
				moqNumeric: null,
				yearsActive: null,
				hasTradeAssurance: false,
				certifications: [],
				unitPriceMinUsd: null,
				unitPriceMaxUsd: null,
				priceTiers: null,
				cargoVolumeM3: null,
				unitVolumeM3: null,
				cargoWeightKg: null,
				includesPackaging: null,
				isSample: false
			};
		}

		return {
			pos: rec.position,
			family: rec.family_id,
			familyName: rec.family_name,
			product: rec.name,
			qty: qtyLabel(rec.qty, rec.unit),
			qtyNumeric: rec.qty,
			unit: rec.unit,
			budget: formatBudgetRange(rec.min_price, rec.max_price),
			minPrice: rec.min_price,
			maxPrice: rec.max_price,
			brand: rec.brand,
			score: top.total_score,
			tier: tier(top.recommendation),
			supplier: top.supplier,
			supplierId: top.supplier_id ?? '',
			price: top.best_offer.price_raw ?? '—',
			issues: top.warnings.length,
			vendors: rec.vendors.length,
			breakdown: toBreakdown(top),
			pros: top.pros.map(matchFlag),
			warnings: top.warnings.map(matchFlag),
			alternatives: offers.slice(1),
			disqualifiedCount,
			listingUrl: top.best_offer.url ?? '',
			moqLabel: moqLabel(top),
			moqNumeric: top.best_offer.moq,
			yearsActive: top.years_active,
			hasTradeAssurance: top.has_trade_assurance,
			certifications: top.certifications,
			unitPriceMinUsd: top.best_offer.price_min,
			unitPriceMaxUsd: top.best_offer.price_max,
			priceTiers: null,
			cargoVolumeM3: null,
			unitVolumeM3: null,
			cargoWeightKg: null,
			includesPackaging: null,
			isSample: false
		};
	});

	const disqualified: SourcingReport['disqualified'] = response.disqualified.map(
		(entry: DisqualifiedPayload) => ({
			position: entry.position,
			product: entry.item_name,
			supplier: entry.supplier,
			reasons: entry.reasons.map(matchFlag)
		})
	);

	const crossItemVendors: CrossItemVendor[] = response.cross_item_vendors.map((vendor) => {
		const products = vendor.positions
			? recommendations.filter((item) => vendor.positions.includes(item.pos))
			: recommendations.filter((item) => item.supplier === vendor.supplier);
		return {
			supplier: vendor.supplier,
			supplierId: vendor.supplier_id,
			products,
			average: vendor.avg_score,
			familiesCovered: vendor.families
		};
	});

	const creditEstimate = {
		totalProducts: meta.total_products,
		familyCount: meta.total_families,
		apiCallReductionPct: meta.api_call_reduction_pct,
		creditsPerPage: meta.proxy_mode === 'stealth' ? 80 : 30,
		estimatedCredits: 0,
		ungroupedCredits: 0,
		creditsSaved: 0,
		proxyMode: (meta.proxy_mode === 'stealth' ? 'stealth' : 'premium') as 'premium' | 'stealth'
	};

	const cache: FamilyScrapeCache = {};

	return {
		runDate: meta.generated_at,
		sourceLabel: SOURCE_CONSOLIDATED,
		catalogName: meta.source_excel,
		rfqFileId: meta.rfq_file_id || undefined,
		config,
		rfqItems,
		families,
		recommendations,
		disqualified,
		crossItemVendors,
		creditEstimate,
		cache
	};
}

function planFamily(fam: FamilySearchPlanPayload): ProductFamily {
	const { min_price: min, max_price: max } = fam;
	const avg =
		min !== null && max !== null
			? Number(((min + max) / 2).toFixed(2))
			: min ?? max ?? null;
	return {
		familyId: fam.family_id,
		name: fam.family_name,
		searchQuery: fam.search_query,
		cohesionScore: fam.cohesion_score,
		positions: fam.positions,
		itemCount: fam.item_count,
		avgPrice: avg
	};
}
