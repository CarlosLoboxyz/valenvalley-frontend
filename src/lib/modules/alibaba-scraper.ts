import type { ServerScraperEnv } from '$lib/config/pipeline-config';
import type { AlibabaListing, FamilyScrapeCache } from '$lib/types/sourcing';
import { normalizeQueryKey, parsePriceRange } from '$lib/utils/format';

const AI_EXTRACT_RULES = {
	products: {
		description:
			'Organic wholesale product listings on Alibaba search results (skip sponsored ads)',
		type: 'list',
		output: {
			title: 'Product title',
			price: 'Listed wholesale price or price range in USD',
			moq: 'Minimum order quantity text including unit (e.g. 100 pieces)',
			supplier: 'Supplier company name',
			years_active: 'Years active on Alibaba as a number',
			certifications: 'Compliance or certification badges (e.g. CE, ISO9001, RoHS)',
			has_trade_assurance: 'Boolean whether Trade Assurance badge is shown',
			url: 'Product detail or supplier storefront URL'
		}
	}
};

export function buildAlibabaSearchUrl(baseUrl: string, query: string, page = 1): string {
	const url = new URL(baseUrl);
	url.searchParams.set('SearchText', query);
	url.searchParams.set('tab', 'all');
	url.searchParams.set('page', String(page));
	return url.toString();
}

export function cleanTrackingUrl(rawUrl: string): string {
	if (!rawUrl) return '';
	try {
		const parsed = new URL(rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl);
		return `${parsed.origin}${parsed.pathname}`;
	} catch {
		return rawUrl.split('?')[0] ?? rawUrl;
	}
}

export function extractSupplierId(supplier: string, url: string): string {
	try {
		const parsed = new URL(url.startsWith('//') ? `https:${url}` : url);
		const subdomain = parsed.hostname.split('.')[0];
		if (subdomain && subdomain !== 'www' && subdomain !== 'alibaba') {
			return subdomain;
		}
		const companyId = parsed.searchParams.get('companyId');
		if (companyId) return companyId;
	} catch {
		// fallback below
	}
	return supplier
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 32);
}

/**
 * Truncation-resilient JSON parser that recovers valid records before cutoff
 * and drops incomplete trailing objects (mirrors `json-repair` strategy in context).
 */
export function repairTruncatedJsonArray(rawText: string): Record<string, unknown>[] {
	const trimmed = rawText.trim();
	try {
		const parsed = JSON.parse(trimmed);
		if (Array.isArray(parsed)) return parsed;
		if (parsed && Array.isArray(parsed.products)) return parsed.products;
	} catch {
		// Attempt progressive recovery before truncation cutoff
	}

	const startIdx = trimmed.indexOf('[');
	if (startIdx === -1) return [];

	let slice = trimmed.slice(startIdx);
	while (slice.length > 2) {
		const lastBrace = slice.lastIndexOf('}');
		if (lastBrace === -1) break;
		const candidate = `${slice.slice(0, lastBrace + 1)}]`;
		try {
			const recovered = JSON.parse(candidate);
			if (Array.isArray(recovered)) return recovered;
		} catch {
			slice = slice.slice(0, lastBrace);
		}
	}
	return [];
}

function normalizeListing(raw: Record<string, unknown>): AlibabaListing | null {
	const title = String(raw.title ?? '').trim();
	const supplier = String(raw.supplier ?? '').trim();
	if (!title || !supplier) return null;

	const price = String(raw.price ?? '').trim() || 'Contact supplier';
	const { min: priceMin, max: priceMax } = parsePriceRange(price);

	const moqText = String(raw.moq ?? '').trim();
	const moqNumMatch = moqText.match(/\d+(?:\.\d+)?/);
	const moq = moqNumMatch ? Number(moqNumMatch[0]) : null;
	const moqUnit = moqText.replace(/\d+(?:\.\d+)?/g, '').trim() || 'pcs';

	const yearsRaw = String(raw.years_active ?? '').match(/\d+/);
	const yearsActive = yearsRaw ? Number(yearsRaw[0]) : null;

	const certsRaw = raw.certifications;
	const certifications: string[] = Array.isArray(certsRaw)
		? certsRaw.map((c) => String(c).trim().toUpperCase()).filter(Boolean)
		: typeof certsRaw === 'string'
			? certsRaw
					.split(/[,;/]+/)
					.map((c) => c.trim().toUpperCase())
					.filter(Boolean)
			: [];

	const rawUrl = String(raw.url ?? '');
	const url = cleanTrackingUrl(rawUrl);

	return {
		title,
		price,
		priceMin,
		priceMax,
		moq,
		moqUnit,
		supplier,
		supplierId: extractSupplierId(supplier, rawUrl),
		yearsActive,
		certifications,
		hasTradeAssurance: Boolean(raw.has_trade_assurance),
		url
	};
}

/**
 * Calls ScrapingBee with JS rendering, premium/stealth proxy, and AI extraction rules.
 * Checks query-keyed cache first unless `forceRefresh` is true.
 */
export async function scrapeAlibabaFamily(params: {
	query: string;
	pages: number;
	stealthProxy: boolean;
	maxProductsPerPage: number;
	env: ServerScraperEnv;
	cache: FamilyScrapeCache;
	forceRefresh?: boolean;
}): Promise<{ listings: AlibabaListing[]; creditsUsed: number; fromCache: boolean }> {
	const key = normalizeQueryKey(params.query);
	if (!params.forceRefresh && params.cache[key]) {
		return {
			listings: params.cache[key].listings,
			creditsUsed: 0,
			fromCache: true
		};
	}

	if (!params.env.scrapingBeeApiKey || params.env.scrapingBeeApiKey === 'your_api_key_here') {
		throw new Error(
			'SCRAPINGBEE_API_KEY is not configured in .env. Set a valid key or enable --from-cache mode.'
		);
	}

	const collected: AlibabaListing[] = [];
	let totalCredits = 0;

	for (let page = 1; page <= params.pages; page++) {
		const targetUrl = buildAlibabaSearchUrl(params.env.alibabaSearchUrl, params.query, page);
		const endpoint = new URL(params.env.scrapingBeeUrl);
		endpoint.searchParams.set('url', targetUrl);
		endpoint.searchParams.set('render_js', 'true');
		endpoint.searchParams.set('wait', String(params.env.waitMs));
		endpoint.searchParams.set('ai_extract_rules', JSON.stringify(AI_EXTRACT_RULES));

		if (params.stealthProxy) {
			endpoint.searchParams.set('stealth_proxy', 'true');
		} else {
			endpoint.searchParams.set('premium_proxy', 'true');
		}

		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), params.env.timeoutSec * 1000);

		try {
			const response = await fetch(endpoint.toString(), {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${params.env.scrapingBeeApiKey}`
				},
				signal: controller.signal
			});

			const spbCost = Number(response.headers.get('Spb-cost') ?? 0);
			if (Number.isFinite(spbCost)) totalCredits += spbCost;

			const bodyText = await response.text();
			if (!response.ok) {
				throw new Error(`ScrapingBee HTTP ${response.status}: ${bodyText.slice(0, 200)}`);
			}

			const rawObjects = repairTruncatedJsonArray(bodyText);
			for (const obj of rawObjects.slice(0, params.maxProductsPerPage)) {
				const normalized = normalizeListing(obj);
				if (normalized) collected.push(normalized);
			}
		} finally {
			clearTimeout(timer);
		}

		if (page < params.pages && params.env.requestDelaySeconds > 0) {
			await new Promise((resolve) =>
				setTimeout(resolve, params.env.requestDelaySeconds * 1000)
			);
		}
	}

	params.cache[key] = {
		query: params.query,
		scrapedAt: new Date().toISOString(),
		creditsUsed: totalCredits,
		listings: collected
	};

	return {
		listings: collected,
		creditsUsed: totalCredits,
		fromCache: false
	};
}
