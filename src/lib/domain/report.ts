import type { ScoredVendorOffer, SourcingReport } from '$lib/types/sourcing';
import { normalizeFlags } from './flags';

function normalizeOffer(offer: ScoredVendorOffer): ScoredVendorOffer {
	return {
		...offer,
		pros: normalizeFlags(offer.pros),
		warnings: normalizeFlags(offer.warnings),
		disqualificationReasons: normalizeFlags(offer.disqualificationReasons)
	};
}

/**
 * Lleva un reporte importado (posiblemente exportado por una versión anterior, con alertas
 * como texto) al formato actual de mensajes con código. No muta el original.
 */
export function normalizeReport(report: SourcingReport): SourcingReport {
	return {
		...report,
		recommendations: report.recommendations.map((item) => ({
			...item,
			pros: normalizeFlags(item.pros),
			warnings: normalizeFlags(item.warnings),
			alternatives: (item.alternatives ?? []).map(normalizeOffer)
		})),
		disqualified: (report.disqualified ?? []).map((entry) => ({
			...entry,
			reasons: normalizeFlags(entry.reasons)
		}))
	};
}
