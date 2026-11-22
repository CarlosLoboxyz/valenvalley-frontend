import * as XLSX from 'xlsx';
import type {
	AlibabaListing,
	CrossItemVendor,
	FamilyScrapeCache,
	PipelineConfig,
	ProductFamily,
	RecommendationItem,
	RfqItem,
	ScoredVendorOffer,
	SourcingReport
} from '$lib/types/sourcing';
import { flag, type FlagMessage } from '$lib/domain/flags';
import {
	MOQ_NOT_AVAILABLE,
	MOQ_UNCONFIRMED,
	SOURCE_CONSOLIDATED,
	hasNoSupplier
} from '$lib/domain/labels';
import { classifyTier, formatBudgetRange, normalizeQueryKey, parsePriceRange } from '$lib/utils/format';
import { calculateCreditEstimate } from './cost-estimator';
import { groupProductsIntoFamilies } from './family-grouper';
import { evaluateVendorsForGroup, normalizeUnit } from './vendor-recommender';

const HEADER_ALIASES: Record<string, string> = {
	position: 'position',
	pos: 'position',
	'#': 'position',
	name: 'name',
	product: 'name',
	'product name': 'name',
	description: 'description',
	desc: 'description',
	unit: 'unit',
	uom: 'unit',
	qty: 'qty',
	quantity: 'qty',
	'min price': 'minPrice',
	min_price: 'minPrice',
	'max price': 'maxPrice',
	max_price: 'maxPrice',
	brand: 'brand',
	'technical specs': 'technicalSpecs',
	technical_specs: 'technicalSpecs',
	specs: 'technicalSpecs'
};

function parseTechnicalSpecs(raw: unknown): {
	specs: Record<string, string | number | boolean>;
	certs: string[];
} {
	if (!raw) return { specs: {}, certs: [] };
	let obj: Record<string, unknown> = {};

	if (typeof raw === 'object' && !Array.isArray(raw)) {
		obj = raw as Record<string, unknown>;
	} else if (typeof raw === 'string') {
		const trimmed = raw.trim();
		if (trimmed.startsWith('{')) {
			try {
				obj = JSON.parse(trimmed);
			} catch {
				// Fault-tolerant fallback for malformed JSON strings
				const cleaned = trimmed
					.replace(/'/g, '"')
					.replace(/,\s*}/g, '}');
				try {
					obj = JSON.parse(cleaned);
				} catch {
					obj = { notes: trimmed };
				}
			}
		} else {
			for (const pair of trimmed.split(/[;\n]+/)) {
				const [k, ...rest] = pair.split(':');
				if (k && rest.length > 0) {
					obj[k.trim()] = rest.join(':').trim();
				}
			}
		}
	}

	const specs: Record<string, string | number | boolean> = {};
	const certs: string[] = [];

	for (const [k, v] of Object.entries(obj)) {
		const keyLower = k.toLowerCase().trim();
		if (['certifications', 'standards', 'compliance'].includes(keyLower)) {
			if (Array.isArray(v)) {
				for (const item of v) certs.push(String(item).trim().toUpperCase());
			} else if (typeof v === 'string') {
				for (const item of v.split(/[,;/]+/)) {
					if (item.trim()) certs.push(item.trim().toUpperCase());
				}
			}
		} else if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
			specs[k.trim()] = v;
		} else if (v !== null && v !== undefined) {
			specs[k.trim()] = JSON.stringify(v);
		}
	}

	return { specs, certs: Array.from(new Set(certs)) };
}

function isFlexibleBrand(brand: string): boolean {
	const b = brand.toLowerCase().trim();
	return (
		!b ||
		b.includes('or similar') ||
		b.includes('equivalent') ||
		b.includes('generic') ||
		b.includes('oem') ||
		b.includes('any')
	);
}

/**
 * Parses an uploaded Excel (.xlsx) or CSV buffer into normalized RfqItems.
 * Direct TypeScript port of `scripts/process_rfq_excel.py`.
 */
export function parseRfqWorkbook(buffer: ArrayBuffer): RfqItem[] {
	const workbook = XLSX.read(buffer, { type: 'array' });
	const preferredSheet =
		workbook.SheetNames.find((s) => s.toLowerCase() === 'products') ?? workbook.SheetNames[0];
	const sheet = workbook.Sheets[preferredSheet];
	if (!sheet) return [];

	const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
	const items: RfqItem[] = [];

	rawRows.forEach((rawRow, idx) => {
		const normalized: Record<string, unknown> = {};
		for (const [rawKey, value] of Object.entries(rawRow)) {
			const cleanKey = rawKey.trim().toLowerCase().replace(/\s+/g, ' ');
			const mapped = HEADER_ALIASES[cleanKey];
			if (mapped) normalized[mapped] = value;
		}

		const name = String(normalized.name ?? '').trim();
		if (!name) return;

		const position = Number(normalized.position) || idx + 1;
		const description = String(normalized.description ?? '').trim();
		const unit = String(normalized.unit ?? 'pcs').trim() || 'pcs';
		const qty = Number(String(normalized.qty ?? '100').replace(/[^0-9.]/g, '')) || 100;
		const minPriceRaw = String(normalized.minPrice ?? '').replace(/[^0-9.]/g, '');
		const maxPriceRaw = String(normalized.maxPrice ?? '').replace(/[^0-9.]/g, '');
		const minPrice = minPriceRaw ? Number(minPriceRaw) : null;
		const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : null;
		const brand = String(normalized.brand ?? 'OEM Generic').trim() || 'OEM Generic';
		const { specs, certs } = parseTechnicalSpecs(normalized.technicalSpecs);

		items.push({
			position,
			name,
			description,
			unit,
			normalizedUnit: normalizeUnit(unit),
			qty,
			qtyLabel: `${qty} ${unit}`,
			minPrice,
			maxPrice,
			budgetLabel: formatBudgetRange(minPrice, maxPrice),
			brand,
			flexibleBrand: isFlexibleBrand(brand),
			technicalSpecs: specs,
			requiredCerts: certs
		});
	});

	return items;
}

function computeRfqFitScore(item: RfqItem, offer: ScoredVendorOffer): {
	rfqFitScore: number;
	warnings: FlagMessage[];
	pros: FlagMessage[];
} {
	const warnings: FlagMessage[] = [];
	const pros: FlagMessage[] = [];
	const listingText = `${offer.listing.title} ${offer.listing.supplier}`.toLowerCase();

	// 1. Technical spec keyword match (65% of RFQ fit)
	const specValues = [
		...Object.values(item.technicalSpecs).map((v) => String(v).toLowerCase()),
		...item.name.toLowerCase().split(/\s+/).filter((w) => w.length >= 3)
	].filter(Boolean);

	let matchedKeywords = 0;
	for (const kw of specValues) {
		if (listingText.includes(kw)) matchedKeywords++;
	}
	const specScore =
		specValues.length > 0 ? Math.min(100, Math.round((matchedKeywords / specValues.length) * 100) + 25) : 70;

	// 2. Brand match (35% of RFQ fit)
	let brandScore = 50;
	const cleanBrand = item.brand.toLowerCase().replace(/or similar|equivalent|oem|generic/g, '').trim();
	if (cleanBrand && listingText.includes(cleanBrand)) {
		brandScore = 100;
		pros.push(flag('P_BRAND_MATCH', { brand: item.brand }));
	} else if (item.flexibleBrand) {
		brandScore = 55;
		warnings.push(flag('W_BRAND_MISMATCH', { brand: item.brand }));
	} else {
		brandScore = 20;
		warnings.push(flag('W_STRICT_BRAND_MISSING', { brand: item.brand }));
	}

	const rfqFitScore = Math.round(specScore * 0.65 + brandScore * 0.35);
	return { rfqFitScore, warnings, pros };
}

/**
 * Evaluates every RFQ item against its family's cached/scraped Alibaba listings
 * using the 75% Vendor Score + 25% RFQ Fit blended formula and produces the full report.
 */
export function buildSourcingReport(params: {
	rfqItems: RfqItem[];
	cache: FamilyScrapeCache;
	config: PipelineConfig;
	catalogName?: string;
	sourceLabel?: string;
	runDate?: string;
	existingFamilies?: ProductFamily[];
}): SourcingReport {
	const { rfqItems, cache, config } = params;

	const grouped = params.existingFamilies
		? {
				families: params.existingFamilies,
				positionToFamily: new Map<number, ProductFamily>(
					params.existingFamilies.flatMap((fam) => fam.positions.map((pos) => [pos, fam]))
				)
			}
		: groupProductsIntoFamilies(rfqItems, config.granularity);

	const recommendations: RecommendationItem[] = [];
	const allDisqualified: SourcingReport['disqualified'] = [];

	const blendTotal = config.weights.vendorScore + config.weights.rfqFit || 100;

	for (const item of rfqItems) {
		const family = grouped.positionToFamily.get(item.position);
		const familyId = family?.familyId ?? 'FAM_00';
		const familyName = family?.name ?? 'General';
		const queryKey = normalizeQueryKey(family?.searchQuery ?? item.name);

		// Lookup cache by family query key or fallback by familyId
		const cacheEntry =
			cache[queryKey] ??
			cache[familyId.toLowerCase()] ??
			Object.values(cache).find((entry) =>
				normalizeQueryKey(entry.query).includes(familyName.toLowerCase())
			);

		const rawListings: AlibabaListing[] = cacheEntry?.listings ?? [];

		const { qualified, disqualified } = evaluateVendorsForGroup({
			listings: rawListings,
			targetQty: item.qty,
			targetUnit: item.unit,
			maxPrice: item.maxPrice,
			requiredCerts: item.requiredCerts,
			filters: config.filters,
			weights: config.weights
		});

		const blendedOffers: ScoredVendorOffer[] = [];

		for (const offer of qualified) {
			const rfqEval = computeRfqFitScore(item, offer);
			let finalScore =
				(offer.breakdown.vendorScore * config.weights.vendorScore +
					rfqEval.rfqFitScore * config.weights.rfqFit) /
				blendTotal;

			const extraWarnings = [...rfqEval.warnings];
			const listedMin = offer.listing.priceMin ?? parsePriceRange(offer.listing.price).min;

			// Min price floor check
			if (item.minPrice !== null && listedMin !== null && listedMin < item.minPrice) {
				if (config.filters.strictMinPrice) {
					allDisqualified.push({
						position: item.position,
						product: item.name,
						supplier: offer.supplier,
						reasons: [flag('DQ_BELOW_MIN_PRICE_FLOOR', { price: listedMin, min: item.minPrice })]
					});
					continue;
				} else {
					finalScore = Math.max(0, finalScore - 6);
					extraWarnings.push(flag('W_BELOW_TARGET_FLOOR', { min: item.minPrice }));
				}
			}

			finalScore = Number(finalScore.toFixed(1));
			blendedOffers.push({
				...offer,
				tier: classifyTier(finalScore),
				breakdown: {
					...offer.breakdown,
					rfqFitScore: rfqEval.rfqFitScore,
					finalScore
				},
				pros: [...offer.pros, ...rfqEval.pros],
				warnings: [...offer.warnings, ...extraWarnings]
			});
		}

		for (const disq of disqualified) {
			allDisqualified.push({
				position: item.position,
				product: item.name,
				supplier: disq.supplier,
				reasons: disq.disqualificationReasons
			});
		}

		blendedOffers.sort((a, b) => b.breakdown.finalScore - a.breakdown.finalScore);
		const topOffer = blendedOffers[0];

		if (topOffer) {
			recommendations.push({
				pos: item.position,
				family: familyId,
				familyName,
				product: item.name,
				qty: item.qtyLabel,
				qtyNumeric: item.qty,
				unit: item.unit,
				budget: item.budgetLabel,
				minPrice: item.minPrice,
				maxPrice: item.maxPrice,
				brand: item.brand,
				score: topOffer.breakdown.finalScore,
				tier: topOffer.tier,
				supplier: topOffer.supplier,
				supplierId: topOffer.supplierId,
				price: topOffer.listing.price,
				issues: topOffer.warnings.length,
				vendors: blendedOffers.length,
				breakdown: topOffer.breakdown,
				pros: topOffer.pros,
				warnings: topOffer.warnings,
				alternatives: blendedOffers.slice(1, config.topN),
				disqualifiedCount: disqualified.length,
				listingUrl: topOffer.listing.url,
				moqLabel:
					topOffer.listing.moq !== null
						? `${topOffer.listing.moq} ${topOffer.listing.moqUnit}`
						: MOQ_UNCONFIRMED,
				yearsActive: topOffer.listing.yearsActive,
				hasTradeAssurance: topOffer.listing.hasTradeAssurance,
				certifications: topOffer.listing.certifications
			});
		} else {
			recommendations.push({
				pos: item.position,
				family: familyId,
				familyName,
				product: item.name,
				qty: item.qtyLabel,
				qtyNumeric: item.qty,
				unit: item.unit,
				budget: item.budgetLabel,
				minPrice: item.minPrice,
				maxPrice: item.maxPrice,
				brand: item.brand,
				score: 0,
				tier: 'Disqualified',
				supplier: '',
				supplierId: '',
				price: '—',
				issues: 1,
				vendors: 0,
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
				alternatives: [],
				disqualifiedCount: disqualified.length,
				listingUrl: '',
				moqLabel: MOQ_NOT_AVAILABLE,
				yearsActive: null,
				hasTradeAssurance: false,
				certifications: []
			});
		}
	}

	// Cross-item vendor aggregation (consolidation opportunities)
	const vendorGroups = new Map<string, RecommendationItem[]>();
	for (const rec of recommendations) {
		if (hasNoSupplier(rec.supplier)) continue;
		const list = vendorGroups.get(rec.supplier) ?? [];
		list.push(rec);
		vendorGroups.set(rec.supplier, list);
	}

	const crossItemVendors: CrossItemVendor[] = [...vendorGroups.entries()]
		.filter(([, products]) => products.length > 1)
		.map(([supplier, products]) => ({
			supplier,
			supplierId: products[0].supplierId,
			products,
			average: Number(
				(products.reduce((sum, p) => sum + p.score, 0) / products.length).toFixed(1)
			),
			familiesCovered: Array.from(new Set(products.map((p) => p.family)))
		}))
		.sort((a, b) => b.products.length - a.products.length || b.average - a.average);

	const creditEstimate = calculateCreditEstimate({
		totalProducts: rfqItems.length,
		familyCount: grouped.families.length,
		pagesPerFamily: config.pagesPerFamily,
		stealthProxy: config.stealthProxy
	});

	return {
		runDate: params.runDate ?? new Date().toISOString().slice(0, 10),
		sourceLabel: params.sourceLabel ?? SOURCE_CONSOLIDATED,
		catalogName: params.catalogName ?? 'products.xlsx',
		config,
		rfqItems,
		families: grouped.families,
		recommendations,
		disqualified: allDisqualified,
		crossItemVendors,
		creditEstimate,
		cache
	};
}
