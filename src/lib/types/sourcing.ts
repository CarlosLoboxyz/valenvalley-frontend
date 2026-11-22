export type Granularity = 'fine' | 'balanced' | 'broad';
export type RecommendationTier = 'Strong Recommend' | 'Consider' | 'Caution' | 'Disqualified';
export type DashboardTab = 'overview' | 'graphs' | 'pipeline';
export type ScoreFilter = 'All scores' | 'Strong Recommend (75+)' | 'Consider (55+)' | 'Score 50+' | 'Needs review';

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
	pros: string[];
	warnings: string[];
	disqualificationReasons: string[];
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
	pros: string[];
	warnings: string[];
	alternatives: ScoredVendorOffer[];
	disqualifiedCount: number;
	listingUrl: string;
	moqLabel: string;
	yearsActive: number | null;
	hasTradeAssurance: boolean;
	certifications: string[];
}

export interface CrossItemVendor {
	supplier: string;
	supplierId: string;
	products: RecommendationItem[];
	average: number;
	familiesCovered: string[];
}

export interface QualitySignal {
	id: string;
	title: string;
	detail: string;
	severity: 'HIGH' | 'CHECK';
	count: number;
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
		reasons: string[];
	}>;
	crossItemVendors: CrossItemVendor[];
	creditEstimate: CreditEstimate;
	cache: FamilyScrapeCache;
}
