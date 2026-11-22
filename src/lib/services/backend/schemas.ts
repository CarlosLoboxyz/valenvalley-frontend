import { z } from 'zod';
import type {
	GroupResponse,
	HealthResponse,
	JobCreated,
	JobStatus,
	LatestResponse,
	PublicConfig,
	RfqCreated,
	ScoreResponse
} from './types';

/*
 * Parsons Zod en tiempo de ejecución para los payloads del backend. El backend ya valida
 * con Pydantic (response_model), pero esto defiende la frontera: cualquier deriva en los
 * campos internos (que llegan como `dict[str, Any]`) se captura como error y no como un
 * fallo de render.
 */

const nullableNum = z.number().nullable().catch(null);
const str = z.string().catch('');

const scoreBreakdownSchema = z
	.object({
		price: z.number().catch(0),
		moq: z.number().catch(0),
		years_active: z.number().catch(0),
		trade_assurance: z.number().catch(0),
		certifications: z.number().catch(0)
	})
	.catch({ price: 0, moq: 0, years_active: 0, trade_assurance: 0, certifications: 0 });

const bestOfferSchema = z
	.object({
		title: str,
		price_raw: z.string().nullable().catch(null),
		price_min: nullableNum,
		price_max: nullableNum,
		price_mid: nullableNum,
		moq: nullableNum,
		moq_unit: str,
		url: z.string().nullable().catch(null)
	})
	.catch({ title: '', price_raw: null, price_min: null, price_max: null, price_mid: null, moq: null, moq_unit: '', url: null });

const vendorSchema = z
	.object({
		supplier: str,
		supplier_id: z.string().nullable().catch(null),
		recommendation: str,
		years_active: nullableNum,
		has_trade_assurance: z.boolean().catch(false),
		certifications: z.array(z.string()).catch([]),
		best_offer: bestOfferSchema,
		score_breakdown: scoreBreakdownSchema,
		vendor_score: z.number().catch(0),
		rfq_fit_score: z.number().catch(0),
		total_score: z.number().catch(0),
		pros: z.array(z.string()).catch([]),
		warnings: z.array(z.string()).catch([])
	});

const recommendationSchema = z.object({
	position: z.number(),
	name: str,
	qty: z.number().catch(0),
	unit: str,
	min_price: nullableNum,
	max_price: nullableNum,
	brand: str,
	family_id: str,
	family_name: str,
	family_search_query: str,
	required_certs_applied: z.array(z.string()).catch([]),
	vendors: z.array(vendorSchema).catch([])
});

const disqualifiedSchema = z.object({
	position: z.number(),
	family_id: str,
	item_name: str,
	supplier: str,
	supplier_id: str,
	price: str,
	moq: nullableNum,
	reasons: z.array(z.string()).catch([]),
	url: z.string().nullable().catch(null)
});

const familyPlanSchema = z.object({
	family_id: str,
	family_name: str,
	search_query: str,
	cohesion_score: z.number().catch(0),
	item_count: z.number().catch(0),
	positions: z.array(z.number()).catch([]),
	total_qty: nullableNum,
	min_price: nullableNum,
	max_price: nullableNum,
	sample_items: z.array(z.string()).catch([]),
	listings_scraped: z.number().catch(0)
});

const crossVendorSchema = z.object({
	supplier: str,
	supplier_id: str,
	items_covered: z.number().catch(0),
	families_covered: z.number().catch(0),
	avg_score: z.number().catch(0),
	years_active: nullableNum,
	has_trade_assurance: z.boolean().catch(false),
	certifications: z.array(z.string()).catch([]),
	positions: z.array(z.number()).catch([]),
	families: z.array(z.string()).catch([]),
	item_names: z.array(z.string()).catch([])
});

const metaSchema = z.object({
	source_excel: str,
	granularity: str,
	total_products: z.number().catch(0),
	total_families: z.number().catch(0),
	api_call_reduction_pct: z.number().catch(0),
	pages_per_family: z.number().catch(1),
	proxy_mode: str,
	top_n: z.number().catch(5),
	credits_spent: z.number().catch(0),
	generated_at: z.string().catch(''),
	filters: z.record(z.string(), z.unknown()).catch({}),
	rfq_file_id: z.string().optional().catch(undefined)
});

const dashboardSchema = z.object({
	tier_distribution: z.record(z.string(), z.number()).catch({}),
	score_component_averages: z.record(z.string(), z.number().nullable()).catch({}),
	positions_total: z.number().catch(0),
	positions_without_vendors: z.number().catch(0),
	cross_item_vendors_total: z.number().catch(0),
	cross_item_vendors_multi: z.number().catch(0),
	risk_flag_counts: z.record(z.string(), z.number()).catch({}),
	missing_cache_families: z.array(z.string()).catch([])
});

export const deliverableSchema = z.object({
	meta: metaSchema,
	recommendations: z.array(recommendationSchema).catch([]),
	family_search_plan: z.array(familyPlanSchema).catch([]),
	cross_item_vendors: z.array(crossVendorSchema).catch([]),
	disqualified: z.array(disqualifiedSchema).catch([]),
	dashboard: dashboardSchema,
	warnings: z.array(z.string()).catch([])
});

export const scoreResponseSchema = deliverableSchema.extend({
	effective_weights: z
		.object({
			vendor: z.record(z.string(), z.number()).catch({}),
			blend: z.record(z.string(), z.number()).catch({})
		})
		.catch({ vendor: {}, blend: {} }),
	credits_consumed: z.number().catch(0),
	persisted: z.boolean().catch(false)
});

export const latestResponseSchema = z.object({
	exists: z.boolean().catch(false),
	result: deliverableSchema.nullable().catch(null)
});

export const healthResponseSchema = z.object({
	status: z.string(),
	scrapingbee_configured: z.boolean().catch(false),
	cache_entries: z.number().catch(0),
	default_rfq_exists: z.boolean().catch(false)
});

export const publicConfigSchema = z.object({
	filters: z
		.object({
			required_certs: z.array(z.string()).catch([]),
			min_years: z.number().catch(0),
			require_trade_assurance: z.boolean().catch(false),
			strict_moq: z.boolean().catch(false),
			strict_certs: z.boolean().catch(false),
			strict_min_price: z.boolean().catch(false)
		})
		.catch({
			required_certs: [],
			min_years: 0,
			require_trade_assurance: false,
			strict_moq: false,
			strict_certs: false,
			strict_min_price: false
		}),
	weights: z
		.object({
			weight_price: z.number().catch(30),
			weight_moq: z.number().catch(20),
			weight_trade_assurance: z.number().catch(20),
			weight_years: z.number().catch(15),
			weight_certs: z.number().catch(15),
			weight_vendor_score: z.number().catch(75),
			weight_rfq_fit: z.number().catch(25)
		})
		.catch({
			weight_price: 30,
			weight_moq: 20,
			weight_trade_assurance: 20,
			weight_years: 15,
			weight_certs: 15,
			weight_vendor_score: 75,
			weight_rfq_fit: 25
		}),
	proxy_mode: z.string().catch('premium'),
	stealth_default: z.boolean().catch(false),
	granularity: z.string().catch('balanced'),
	default_pages: z.number().catch(1),
	max_products_per_page: z.number().catch(15),
	recommend_top_n: z.number().catch(5),
	max_upload_mb: z.number().catch(20),
	require_verified_email: z.boolean().catch(true),
	credit_rates: z
		.object({ premium_per_page: z.number().catch(30), stealth_per_page: z.number().catch(80) })
		.catch({ premium_per_page: 30, stealth_per_page: 80 }),
	max_credits_per_job: z.number().nullable().catch(null),
	max_credits_per_day: z.number().nullable().catch(null)
});

export function parseScoreResponse(data: unknown): ScoreResponse {
	return scoreResponseSchema.parse(data) as ScoreResponse;
}

export function parseLatestResponse(data: unknown): LatestResponse {
	return latestResponseSchema.parse(data) as LatestResponse;
}

export function parseHealthResponse(data: unknown): HealthResponse {
	return healthResponseSchema.parse(data) as HealthResponse;
}

export function parsePublicConfig(data: unknown): PublicConfig {
	return publicConfigSchema.parse(data) as PublicConfig;
}

export function parseBackendError(data: unknown): { code: string; detail: unknown } {
	const parsed = z
		.object({
			code: z.string().catch('backend_error'),
			detail: z.unknown().optional()
		})
		.catch({ code: 'backend_error', detail: undefined })
		.parse(data);
	return { code: parsed.code, detail: parsed.detail };
}

// ── Onboarding ──

const budgetSchema = z.object({
	total_families: z.number().catch(0),
	cached_families: z.number().catch(0),
	families_to_scrape: z.number().catch(0),
	pages: z.number().catch(1),
	stealth: z.boolean().catch(false),
	rate_per_page: z.number().catch(30),
	estimated_credits: z.number().catch(0)
});

export const rfqCreatedSchema = z.object({
	upload_id: z.string(),
	filename: str,
	row_count: z.number().catch(0),
	sheets: z.array(z.string()).catch([]),
	sheet: str,
	warnings: z.array(z.string()).catch([]),
	preview: z
		.array(
			z.object({
				position: z.number().catch(0),
				name: str,
				qty: nullableNum,
				unit: z.string().nullable().catch(null),
				min_price: nullableNum,
				max_price: nullableNum,
				brand: z.string().nullable().catch(null)
			})
		)
		.catch([])
});

export const groupResponseSchema = z.object({
	total_items: z.number().catch(0),
	family_count: z.number().catch(0),
	api_reduction_pct: z.number().catch(0),
	cached_families: z.number().catch(0),
	uncached_families: z.number().catch(0),
	pages: z.number().catch(1),
	stealth: z.boolean().catch(false),
	estimated_credits_premium: z.number().catch(0),
	estimated_credits_stealth: z.number().catch(0),
	estimated_credits_selected: z.number().catch(0),
	granularity: str,
	families: z
		.array(
			z.object({
				family_id: str,
				family_name: str,
				search_query: str,
				cohesion_score: z.number().catch(0),
				item_count: z.number().catch(0),
				positions: z.array(z.number()).catch([]),
				is_cached: z.boolean().catch(false),
				cached_listing_count: z.number().catch(0)
			})
		)
		.catch([]),
	warnings: z.array(z.string()).catch([])
});

const jobStateSchema = z.enum(['queued', 'running', 'completed', 'cancelled', 'failed']);

export const jobCreatedSchema = z.object({
	job_id: z.string(),
	status: jobStateSchema.catch('queued'),
	projected_budget: budgetSchema
});

export const jobStatusSchema = z.object({
	job_id: z.string(),
	rfq_file_id: z.string().nullable().catch(null),
	granularity: z.string().nullable().catch(null),
	status: jobStateSchema.catch('failed'),
	progress: z
		.object({
			completed_families: z.number().catch(0),
			total_families: z.number().catch(0),
			cache_hits: z.number().catch(0),
			live_fetches: z.number().catch(0)
		})
		.catch({ completed_families: 0, total_families: 0, cache_hits: 0, live_fetches: 0 }),
	credits_spent: z.number().catch(0),
	projected_budget: budgetSchema,
	family_logs: z
		.array(
			z.object({
				family_id: str,
				search_query: str,
				status: str,
				listing_count: z.number().catch(0),
				credits: z.number().catch(0),
				warnings: z.array(z.string()).catch([]),
				error: z.string().nullable().catch(null)
			})
		)
		.catch([]),
	warnings: z.array(z.string()).catch([]),
	error: z.string().nullable().catch(null),
	created_at: str,
	finished_at: z.string().nullable().catch(null)
});

export function parseRfqCreated(data: unknown): RfqCreated {
	return rfqCreatedSchema.parse(data) as RfqCreated;
}

export function parseGroupResponse(data: unknown): GroupResponse {
	return groupResponseSchema.parse(data) as GroupResponse;
}

export function parseJobCreated(data: unknown): JobCreated {
	return jobCreatedSchema.parse(data) as JobCreated;
}

export function parseJobStatus(data: unknown): JobStatus {
	return jobStatusSchema.parse(data) as JobStatus;
}

export function parseActiveJob(data: unknown): JobStatus | null {
	return data === null || data === undefined ? null : parseJobStatus(data);
}
