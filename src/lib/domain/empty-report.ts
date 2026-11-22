import { DEFAULT_PIPELINE_CONFIG } from '$lib/config/pipeline-config';
import { SOURCE_CONSOLIDATED } from '$lib/domain/labels';
import type { SourcingReport } from '$lib/types/sourcing';

/**
 * Reporte vacío: estado inicial del store antes de hidratar. No contiene datos de ejemplo;
 * el dashboard sólo se muestra con un reporte real del backend.
 */
export function createEmptySourcingReport(): SourcingReport {
	return {
		runDate: '',
		sourceLabel: SOURCE_CONSOLIDATED,
		catalogName: '',
		config: structuredClone(DEFAULT_PIPELINE_CONFIG),
		rfqItems: [],
		families: [],
		recommendations: [],
		disqualified: [],
		crossItemVendors: [],
		creditEstimate: {
			totalProducts: 0,
			familyCount: 0,
			apiCallReductionPct: 0,
			creditsPerPage: 30,
			estimatedCredits: 0,
			ungroupedCredits: 0,
			creditsSaved: 0,
			proxyMode: 'premium'
		},
		cache: {}
	};
}
