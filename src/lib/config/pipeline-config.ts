import type { Granularity, PipelineConfig } from '$lib/types/sourcing';

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
	granularity: 'balanced',
	stealthProxy: false,
	pagesPerFamily: 1,
	maxProductsPerPage: 15,
	topN: 5,
	fromCache: true,
	dryRun: false,
	filters: {
		requiredCerts: [],
		minYears: 0,
		requireTradeAssurance: false,
		strictMoq: false,
		strictCerts: false,
		strictMinPrice: false,
		maxPriceOverride: null
	},
	weights: {
		price: 30,
		moq: 20,
		tradeAssurance: 20,
		years: 15,
		certs: 15,
		vendorScore: 75,
		rfqFit: 25
	}
};

export interface ServerScraperEnv {
	scrapingBeeApiKey: string;
	scrapingBeeUrl: string;
	alibabaSearchUrl: string;
	waitMs: number;
	timeoutSec: number;
	requestDelaySeconds: number;
	debugDir: string;
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
	if (value === undefined || value === '') return fallback;
	return value.toLowerCase() === 'true' || value === '1';
}

function parseNum(value: string | undefined, fallback: number): number {
	if (value === undefined || value === '') return fallback;
	const n = Number(value);
	return Number.isFinite(n) ? n : fallback;
}

function parseGranularity(value: string | undefined): Granularity {
	if (value === 'fine' || value === 'balanced' || value === 'broad') return value;
	return DEFAULT_PIPELINE_CONFIG.granularity;
}

export function loadConfigFromEnv(env: Record<string, string | undefined>): {
	pipeline: PipelineConfig;
	scraper: ServerScraperEnv;
} {
	const requiredCerts = (env.CLIENT_REQUIRED_CERTS ?? '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);

	return {
		pipeline: {
			granularity: parseGranularity(env.FAMILY_GRANULARITY),
			stealthProxy: parseBool(env.SCRAPINGBEE_STEALTH_PROXY, DEFAULT_PIPELINE_CONFIG.stealthProxy),
			pagesPerFamily: parseNum(env.DEFAULT_PAGES, DEFAULT_PIPELINE_CONFIG.pagesPerFamily),
			maxProductsPerPage: parseNum(
				env.MAX_PRODUCTS_PER_PAGE,
				DEFAULT_PIPELINE_CONFIG.maxProductsPerPage
			),
			topN: parseNum(env.RECOMMEND_TOP_N, DEFAULT_PIPELINE_CONFIG.topN),
			fromCache: true,
			dryRun: false,
			filters: {
				requiredCerts,
				minYears: parseNum(env.CLIENT_MIN_YEARS, 0),
				requireTradeAssurance: parseBool(env.CLIENT_REQUIRE_TRADE_ASSURANCE, false),
				strictMoq: parseBool(env.CLIENT_STRICT_MOQ, false),
				strictCerts: parseBool(env.CLIENT_STRICT_CERTS, false),
				strictMinPrice: parseBool(env.STRICT_MIN_PRICE, false),
				maxPriceOverride: null
			},
			weights: {
				price: parseNum(env.WEIGHT_PRICE, 30),
				moq: parseNum(env.WEIGHT_MOQ, 20),
				tradeAssurance: parseNum(env.WEIGHT_TRADE_ASSURANCE, 20),
				years: parseNum(env.WEIGHT_YEARS, 15),
				certs: parseNum(env.WEIGHT_CERTS, 15),
				vendorScore: parseNum(env.WEIGHT_VENDOR_SCORE, 75),
				rfqFit: parseNum(env.WEIGHT_RFQ_FIT, 25)
			}
		},
		scraper: {
			scrapingBeeApiKey: env.SCRAPINGBEE_API_KEY ?? '',
			scrapingBeeUrl: env.SCRAPINGBEE_URL ?? 'https://app.scrapingbee.com/api/v1/',
			alibabaSearchUrl: env.ALIBABA_SEARCH_URL ?? 'https://www.alibaba.com/trade/search',
			waitMs: parseNum(env.SCRAPINGBEE_WAIT_MS, 3000),
			timeoutSec: parseNum(env.SCRAPINGBEE_TIMEOUT, 90),
			requestDelaySeconds: parseNum(env.REQUEST_DELAY_SECONDS, 1.0),
			debugDir: env.DEBUG_DIR ?? 'debug_raw'
		}
	};
}
