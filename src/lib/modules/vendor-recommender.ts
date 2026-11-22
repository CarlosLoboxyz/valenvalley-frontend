import type {
	AlibabaListing,
	ClientFilters,
	PipelineWeights,
	ScoredVendorOffer
} from '$lib/types/sourcing';
import { classifyTier } from '$lib/utils/format';

function normalizeSupplierKey(listing: AlibabaListing): string {
	if (listing.supplierId && listing.supplierId.trim().length > 0) {
		return listing.supplierId.toLowerCase().trim();
	}
	return listing.supplier
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '')
		.trim();
}

function getEffectivePrice(listing: AlibabaListing): number | null {
	if (listing.priceMin !== null && listing.priceMax !== null) {
		return (listing.priceMin + listing.priceMax) / 2;
	}
	return listing.priceMin ?? listing.priceMax;
}

function median(values: number[]): number | null {
	if (values.length === 0) return null;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function normalizeUnit(raw: string): string {
	const u = raw.toLowerCase().trim();
	if (/^(pc|pcs|piece|pieces|unit|units|ea|each)$/.test(u)) return 'pcs';
	if (/^(set|sets|kit|kits)$/.test(u)) return 'sets';
	if (/^(ctn|carton|cartons|box|boxes|case|cases)$/.test(u)) return 'ctn';
	if (/^(pair|pairs)$/.test(u)) return 'pairs';
	if (/^(pack|packs|bag|bags)$/.test(u)) return 'packs';
	return u || 'pcs';
}

/**
 * Deduplicates multiple listings per vendor, applies hard filters, and computes
 * weighted 0–100 vendor scores. Direct TypeScript port of `scripts/recommend_vendors.py`.
 */
export function evaluateVendorsForGroup(params: {
	listings: AlibabaListing[];
	targetQty: number;
	targetUnit: string;
	maxPrice: number | null;
	requiredCerts: string[];
	filters: ClientFilters;
	weights: PipelineWeights;
}): { qualified: ScoredVendorOffer[]; disqualified: ScoredVendorOffer[] } {
	const { listings, targetQty, targetUnit, maxPrice, requiredCerts, filters, weights } = params;

	// 1. Aggregate multiple listings per vendor, merging certifications
	const vendorMap = new Map<string, { listings: AlibabaListing[]; mergedCerts: Set<string> }>();

	for (const listing of listings) {
		const key = normalizeSupplierKey(listing);
		const existing = vendorMap.get(key);
		if (existing) {
			existing.listings.push(listing);
			for (const cert of listing.certifications) existing.mergedCerts.add(cert.toUpperCase());
		} else {
			vendorMap.set(key, {
				listings: [listing],
				mergedCerts: new Set(listing.certifications.map((c) => c.toUpperCase()))
			});
		}
	}

	// Select best-fitting offer per vendor for targetQty
	const dedupedListings: AlibabaListing[] = [];
	for (const { listings: vendorListings, mergedCerts } of vendorMap.values()) {
		const sorted = [...vendorListings].sort((a, b) => {
			const aFits = a.moq !== null && a.moq <= targetQty ? 1 : 0;
			const bFits = b.moq !== null && b.moq <= targetQty ? 1 : 0;
			if (bFits !== aFits) return bFits - aFits;
			const aPrice = getEffectivePrice(a) ?? Number.MAX_SAFE_INTEGER;
			const bPrice = getEffectivePrice(b) ?? Number.MAX_SAFE_INTEGER;
			return aPrice - bPrice;
		});
		const best = {
			...sorted[0],
			certifications: Array.from(mergedCerts)
		};
		dedupedListings.push(best);
	}

	// Group price statistics for relative competitiveness & bait-price detection
	const validPrices = dedupedListings
		.map(getEffectivePrice)
		.filter((p): p is number => p !== null && p > 0);
	const groupMedian = median(validPrices);
	const effectiveMaxPrice = filters.maxPriceOverride ?? maxPrice;

	const combinedRequiredCerts = Array.from(
		new Set([...requiredCerts, ...filters.requiredCerts].map((c) => c.toUpperCase()).filter(Boolean))
	);

	const qualified: ScoredVendorOffer[] = [];
	const disqualified: ScoredVendorOffer[] = [];

	const totalWeight =
		weights.price + weights.moq + weights.tradeAssurance + weights.years + weights.certs || 100;

	for (const listing of dedupedListings) {
		const pros: string[] = [];
		const warnings: string[] = [];
		const disqualificationReasons: string[] = [];

		const price = getEffectivePrice(listing);
		const isBaitPrice =
			price !== null && groupMedian !== null && groupMedian > 0 && price < groupMedian * 0.25;
		const unitMismatch =
			Boolean(listing.moqUnit) &&
			normalizeUnit(listing.moqUnit) !== normalizeUnit(targetUnit);

		// --- Hard Filters ---
		if (filters.requireTradeAssurance && !listing.hasTradeAssurance) {
			disqualificationReasons.push('Missing mandatory Trade Assurance');
		}
		if (filters.minYears > 0 && (listing.yearsActive ?? 0) < filters.minYears) {
			disqualificationReasons.push(
				`Supplier tenure (${listing.yearsActive ?? 'unknown'} yrs) below minimum ${filters.minYears} yrs`
			);
		}
		if (effectiveMaxPrice !== null && price !== null && price > effectiveMaxPrice) {
			disqualificationReasons.push(
				`Listed price ($${price.toFixed(2)}) exceeds max budget ($${effectiveMaxPrice.toFixed(2)})`
			);
		}
		if (filters.strictMoq && (listing.moq === null || listing.moq > targetQty)) {
			disqualificationReasons.push(
				`Strict MOQ failed (MOQ: ${listing.moq ?? 'unconfirmed'} vs target ${targetQty})`
			);
		}
		if (filters.strictCerts && combinedRequiredCerts.length > 0) {
			const missing = combinedRequiredCerts.filter((c) => !listing.certifications.includes(c));
			if (missing.length > 0) {
				disqualificationReasons.push(`Missing required certifications: ${missing.join(', ')}`);
			}
		}

		// --- 1. Price Score (default 30%) ---
		let priceScore = 50;
		if (price === null) {
			priceScore = 35;
			warnings.push('Price not listed on search card');
		} else if (isBaitPrice) {
			priceScore = 25;
			warnings.push('Suspicious bait price (<25% of group median) — verify real unit quote');
		} else if (groupMedian && groupMedian > 0) {
			const ratio = price / groupMedian;
			if (ratio <= 0.85) {
				priceScore = 95;
				pros.push('Highly competitive price within product family');
			} else if (ratio <= 1.0) {
				priceScore = 82;
				pros.push('Below-median family pricing');
			} else if (ratio <= 1.25) {
				priceScore = 65;
			} else {
				priceScore = Math.max(25, Math.round(80 - (ratio - 1) * 40));
				warnings.push('Above-median family pricing');
			}
		}

		// --- 2. MOQ Fit Score (default 20%) ---
		let moqScore = 40;
		if (listing.moq === null) {
			moqScore = 40;
			warnings.push('MOQ not confirmed on listing');
		} else if (listing.moq <= targetQty) {
			moqScore = 100;
			pros.push(`MOQ (${listing.moq} ${listing.moqUnit}) fits target quantity (${targetQty})`);
		} else if (listing.moq <= targetQty * 1.5) {
			moqScore = 65;
			warnings.push(
				`MOQ (${listing.moq}) is up to 1.5x target (${targetQty}) — likely negotiable`
			);
		} else {
			moqScore = 20;
			warnings.push(`MOQ (${listing.moq}) exceeds target quantity (${targetQty})`);
		}

		if (unitMismatch) {
			warnings.push(`Unit mismatch: listing uses ${listing.moqUnit}, RFQ requests ${targetUnit}`);
		}

		// --- 3. Trade Assurance Score (default 20%) ---
		const taScore = listing.hasTradeAssurance ? 100 : 0;
		if (listing.hasTradeAssurance) {
			pros.push('Protected by Alibaba Trade Assurance');
		} else {
			warnings.push('Trade Assurance badge not detected');
		}

		// --- 4. Years Active Score (default 15%, linear to 8+ yrs) ---
		let yearsScore = 30;
		if (listing.yearsActive === null) {
			yearsScore = 30;
			warnings.push('Supplier tenure unknown — confirm company background');
		} else {
			yearsScore = Math.min(100, Math.round((listing.yearsActive / 8) * 100));
			if (listing.yearsActive >= 5) {
				pros.push(`${listing.yearsActive} years active on Alibaba`);
			} else if (listing.yearsActive < 2) {
				warnings.push(`New supplier (${listing.yearsActive} yr active)`);
			}
		}

		// --- 5. Certifications Score (default 15%) ---
		let certsScore = 40;
		if (combinedRequiredCerts.length > 0) {
			const matched = combinedRequiredCerts.filter((c) => listing.certifications.includes(c));
			certsScore = Math.round((matched.length / combinedRequiredCerts.length) * 100);
			if (matched.length === combinedRequiredCerts.length) {
				pros.push(`Matches all required certifications (${matched.join(', ')})`);
			} else {
				const missing = combinedRequiredCerts.filter((c) => !listing.certifications.includes(c));
				warnings.push(`Unverified certifications: ${missing.join(', ')}`);
			}
		} else if (listing.certifications.length > 0) {
			certsScore = Math.min(100, 60 + listing.certifications.length * 15);
			pros.push(`Compliance badges: ${listing.certifications.join(', ')}`);
		} else {
			certsScore = 35;
		}

		const vendorScore = Number(
			(
				(priceScore * weights.price +
					moqScore * weights.moq +
					taScore * weights.tradeAssurance +
					yearsScore * weights.years +
					certsScore * weights.certs) /
				totalWeight
			).toFixed(1)
		);

		const offer: ScoredVendorOffer = {
			supplier: listing.supplier,
			supplierId: listing.supplierId,
			listing,
			tier: disqualificationReasons.length > 0 ? 'Disqualified' : classifyTier(vendorScore),
			breakdown: {
				price: priceScore,
				moqFit: moqScore,
				tradeAssurance: taScore,
				yearsActive: yearsScore,
				certifications: certsScore,
				vendorScore,
				rfqFitScore: 0,
				finalScore: vendorScore
			},
			pros,
			warnings,
			disqualificationReasons,
			isBaitPrice,
			unitMismatch
		};

		if (disqualificationReasons.length > 0) {
			disqualified.push(offer);
		} else {
			qualified.push(offer);
		}
	}

	qualified.sort((a, b) => b.breakdown.vendorScore - a.breakdown.vendorScore);
	return { qualified, disqualified };
}
