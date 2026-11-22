import type { FlagMessage } from '$lib/domain/flags';
import type { MessageKey, Params } from '$lib/i18n';

export type Granularity = 'fine' | 'balanced' | 'broad';
export type RecommendationTier = 'Strong Recommend' | 'Consider' | 'Caution' | 'Disqualified';
export type DashboardTab = 'overview' | 'graphs' | 'pipeline';
/** Códigos de filtro: la interfaz los muestra traducidos, la lógica solo compara códigos. */
export type ScoreFilter = 'all' | 'strong' | 'consider' | 'score50' | 'review';

/** Valor centinela de los filtros de familia y proveedor («todas»). */
export const ALL_FILTER = 'all';

/** Mensaje de estado estructurado: se traduce en la vista, no en el store. */
export interface StatusMessage {
	key: MessageKey;
	params?: Params;
}

export interface RfqItem {
	position: number;
	name: string;
	description: string;
	unit: string;
	normalizedUnit: string;
	qty: number;
	qtyLabel: string;
	minPrice: number | null;
	maxPrice: number | null;
	budgetLabel: string;
	brand: string;
	flexibleBrand: boolean;
	technicalSpecs: Record<string, string | number | boolean>;
	requiredCerts: string[];
}

export interface ProductFamily {
	familyId: string;
	name: string;
	searchQuery: string;
	cohesionScore: number;
	positions: number[];
	itemCount: number;
	avgPrice: number | null;
}

export interface AlibabaListing {
	title: string;
	price: string;
	priceMin: number | null;
	priceMax: number | null;
	moq: number | null;
	moqUnit: string;
	supplier: string;
	supplierId: string;
	yearsActive: number | null;
	certifications: string[];
	hasTradeAssurance: boolean;
	url: string;
}

export interface ScoreBreakdown {
	price: number;
	moqFit: number;
	tradeAssurance: number;
	yearsActive: number;
	certifications: number;
	vendorScore: number;
	rfqFitScore: number;
	finalScore: number;
}

export interface ScoredVendorOffer {
	supplier: string;
	supplierId: string;
	listing: AlibabaListing;
	tier: RecommendationTier;
	breakdown: ScoreBreakdown;
	pros: FlagMessage[];
	warnings: FlagMessage[];
	disqualificationReasons: FlagMessage[];
	isBaitPrice: boolean;
	unitMismatch: boolean;
}

export interface RecommendationItem {
	pos: number;
	family: string;
	familyName: string;
	product: string;
	qty: string;
	qtyNumeric: number;
	unit: string;
	budget: string;
	minPrice: number | null;
	maxPrice: number | null;
	brand: string;
	score: number;
	tier: RecommendationTier;
	supplier: string;
	supplierId: string;
	price: string;
	issues: number;
	vendors: number;
	breakdown: ScoreBreakdown;
	pros: FlagMessage[];
	warnings: FlagMessage[];
	alternatives: ScoredVendorOffer[];
	disqualifiedCount: number;
	listingUrl: string;
	moqLabel: string;
	/** MOQ numérico cuando se conoce (en la unidad de la oferta); `null` si no está confirmado. */
	moqNumeric: number | null;
	yearsActive: number | null;
	hasTradeAssurance: boolean;
	certifications: string[];
	/** Precio unitario de la oferta ganadora en USD, para calcular la cotización. */
	unitPriceMinUsd: number | null;
	unitPriceMaxUsd: number | null;
	/** Escalas de precio por cantidad (si el backend las envía). Se priorizan sobre el rango. */
	priceTiers: PriceTier[] | null;
	/** Estimado de carga para la cantidad pedida, en m³. `null` si el backend no lo envía. */
	cargoVolumeM3: number | null;
	/** Volumen por unidad, en m³ (alternativa al total; se usa `cargoVolumeM3` si ambos vienen). */
	unitVolumeM3: number | null;
	/** Peso de la carga para la cantidad pedida, en kg (opcional). */
	cargoWeightKg: number | null;
	/** ¿El volumen/peso incluyen embalaje? `null` = no informado. */
	includesPackaging: boolean | null;
	/** Dato ilustrativo de la demo: se muestra como «Muestra», nunca como cotización real. */
	isSample: boolean;
}

/**
 * Tramo de precio por cantidad. `unit_price_usd` en USD. Con `maxQty === null`
 * el tramo está abierto hacia arriba; la cantidad pedida cae en el tramo cuyo
 * rango la contiene.
 */
export interface PriceTier {
	min_qty: number;
	max_qty: number | null;
	unit_price_usd: number;
}

export interface CrossItemVendor {
	supplier: string;
	supplierId: string;
	products: RecommendationItem[];
	average: number;
	familiesCovered: string[];
}

export interface QualitySignal {
	id: 'moq' | 'brand' | 'price' | 'tenure';
	severity: 'HIGH' | 'CHECK';
	/** Ofertas afectadas y total evaluado; la vista arma el texto con estos números. */
	count: number;
	total: number;
}

export interface PipelineWeights {
	price: number;
	moq: number;
	tradeAssurance: number;
	years: number;
	certs: number;
	vendorScore: number;
	rfqFit: number;
}

export interface ClientFilters {
	requiredCerts: string[];
	minYears: number;
	requireTradeAssurance: boolean;
	strictMoq: boolean;
	strictCerts: boolean;
	strictMinPrice: boolean;
	maxPriceOverride: number | null;
}

export interface PipelineConfig {
	granularity: Granularity;
	stealthProxy: boolean;
	pagesPerFamily: number;
	maxProductsPerPage: number;
	topN: number;
	fromCache: boolean;
	dryRun: boolean;
	filters: ClientFilters;
	weights: PipelineWeights;
}

export interface CreditEstimate {
	totalProducts: number;
	familyCount: number;
	apiCallReductionPct: number;
	creditsPerPage: number;
	estimatedCredits: number;
	ungroupedCredits: number;
	creditsSaved: number;
	proxyMode: 'premium' | 'stealth';
}

export interface FamilyScrapeCache {
	[normalizedQuery: string]: {
		query: string;
		scrapedAt: string;
		creditsUsed: number;
		listings: AlibabaListing[];
	};
}

export interface SourcingReport {
	runDate: string;
	sourceLabel: string;
	catalogName: string;
	config: PipelineConfig;
	rfqItems: RfqItem[];
	families: ProductFamily[];
	recommendations: RecommendationItem[];
	disqualified: Array<{
		position: number;
		product: string;
		supplier: string;
		reasons: FlagMessage[];
	}>;
	crossItemVendors: CrossItemVendor[];
	creditEstimate: CreditEstimate;
	cache: FamilyScrapeCache;
}
