/**
 * Tipos crudos (snake_case) del backend FastAPI de `valenvalley-alibaba`.
 *
 * Se mantienen lo más fieles posible al contrato `backend/app/schemas/*` para que el
 * mapeo hacia el modelo del frontend viva en un solo lugar (`adapter.ts`).
 * Los campos de volumen, peso y tramos de precio aún NO existen en el backend:
 * se representan como ausentes y llegan `null` al modelo del frontend.
 */

/** Envelope de error del backend: `{"detail": ..., "code": ...}`. */
export interface BackendError {
	code: string;
	detail: unknown;
}

export interface HealthResponse {
	status: string;
	scrapingbee_configured: boolean;
	cache_entries: number;
	default_rfq_exists: boolean;
}

export interface FilterDefaults {
	required_certs: string[];
	min_years: number;
	require_trade_assurance: boolean;
	strict_moq: boolean;
	strict_certs: boolean;
	strict_min_price: boolean;
}

export interface WeightDefaults {
	weight_price: number;
	weight_moq: number;
	weight_trade_assurance: number;
	weight_years: number;
	weight_certs: number;
	weight_vendor_score: number;
	weight_rfq_fit: number;
}

export interface PublicConfig {
	filters: FilterDefaults;
	weights: WeightDefaults;
	proxy_mode: string;
	stealth_default: boolean;
	granularity: string;
	granularities: string[];
	default_pages: number;
	max_products_per_page: number;
	recommend_top_n: number;
	credit_rates: { premium_per_page: number; stealth_per_page: number };
	max_upload_mb: number;
	require_verified_email: boolean;
	max_credits_per_job: number | null;
	max_credits_per_day: number | null;
}

export interface ScoreBreakdownLocal {
	price: number;
	moq: number;
	years_active: number;
	trade_assurance: number;
	certifications: number;
}

export interface BestOffer {
	title: string;
	price_raw: string | null;
	price_min: number | null;
	price_max: number | null;
	price_mid: number | null;
	moq: number | null;
	moq_unit: string;
	url: string | null;
}

export interface VendorPayload {
	supplier: string;
	supplier_id: string | null;
	recommendation: string;
	years_active: number | null;
	has_trade_assurance: boolean;
	certifications: string[];
	best_offer: BestOffer;
	score_breakdown: ScoreBreakdownLocal;
	vendor_score: number;
	rfq_fit_score: number;
	total_score: number;
	pros: string[];
	warnings: string[];
}

export interface RecommendationPayload {
	position: number;
	name: string;
	qty: number;
	unit: string;
	min_price: number | null;
	max_price: number | null;
	brand: string;
	family_id: string;
	family_name: string;
	family_search_query: string;
	required_certs_applied: string[];
	vendors: VendorPayload[];
}

export interface DisqualifiedPayload {
	position: number;
	family_id: string;
	item_name: string;
	supplier: string;
	supplier_id: string;
	price: string;
	moq: number | null;
	reasons: string[];
	url: string | null;
}

export interface FamilySearchPlanPayload {
	family_id: string;
	family_name: string;
	search_query: string;
	cohesion_score: number;
	item_count: number;
	positions: number[];
	total_qty: number | null;
	min_price: number | null;
	max_price: number | null;
	sample_items: string[];
	listings_scraped: number;
}

export interface CrossItemVendorPayload {
	supplier: string;
	supplier_id: string;
	items_covered: number;
	families_covered: number;
	avg_score: number;
	years_active: number | null;
	has_trade_assurance: boolean;
	certifications: string[];
	positions: number[];
	families: string[];
	item_names: string[];
}

export interface DashboardPayload {
	tier_distribution: Record<string, number>;
	score_component_averages: Record<string, number | null>;
	positions_total: number;
	positions_without_vendors: number;
	cross_item_vendors_total: number;
	cross_item_vendors_multi: number;
	risk_flag_counts: Record<string, number>;
	missing_cache_families: string[];
}

export interface BackendMeta {
	source_excel: string;
	granularity: string;
	total_products: number;
	total_families: number;
	api_call_reduction_pct: number;
	pages_per_family: number;
	proxy_mode: string;
	top_n: number;
	credits_spent: number;
	generated_at: string;
	filters: Record<string, unknown>;
	effective_weights?: { vendor: Record<string, number>; blend: Record<string, number> };
	missing_cache_families?: string[];
}

export interface DeliverablePayload {
	meta: BackendMeta;
	recommendations: RecommendationPayload[];
	family_search_plan: FamilySearchPlanPayload[];
	cross_item_vendors: CrossItemVendorPayload[];
	disqualified: DisqualifiedPayload[];
	dashboard: DashboardPayload;
	warnings: string[];
}

export interface ScoreResponse extends DeliverablePayload {
	effective_weights: { vendor: Record<string, number>; blend: Record<string, number> };
	credits_consumed: number;
	persisted: boolean;
}

export interface LatestResponse {
	exists: boolean;
	result: DeliverablePayload | null;
}
