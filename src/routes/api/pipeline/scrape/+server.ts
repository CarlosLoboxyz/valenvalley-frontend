import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { loadConfigFromEnv } from '$lib/config/pipeline-config';
import { scrapeAlibabaFamily } from '$lib/modules/alibaba-scraper';
import { buildSourcingReport } from '$lib/modules/rfq-processor';
import type { FamilyScrapeCache, PipelineConfig, ProductFamily, RfqItem } from '$lib/types/sourcing';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = (await request.json()) as {
			rfqItems: RfqItem[];
			families: ProductFamily[];
			config?: PipelineConfig;
			cache?: FamilyScrapeCache;
			forceRefresh?: boolean;
		};

		if (!Array.isArray(body.rfqItems) || !Array.isArray(body.families)) {
			return json({ error: 'rfqItems and families arrays are required' }, { status: 400 });
		}

		const { pipeline: defaultPipeline, scraper: scraperEnv } = loadConfigFromEnv(env);
		const config = body.config ?? defaultPipeline;
		const cache: FamilyScrapeCache = { ...(body.cache ?? {}) };

		let creditsUsed = 0;
		let familiesScraped = 0;

		for (const family of body.families) {
			const res = await scrapeAlibabaFamily({
				query: family.searchQuery,
				pages: config.pagesPerFamily,
				stealthProxy: config.stealthProxy,
				maxProductsPerPage: config.maxProductsPerPage,
				env: scraperEnv,
				cache,
				forceRefresh: Boolean(body.forceRefresh)
			});
			creditsUsed += res.creditsUsed;
			if (!res.fromCache) familiesScraped++;
		}

		const report = buildSourcingReport({
			rfqItems: body.rfqItems,
			cache,
			config,
			existingFamilies: body.families,
			sourceLabel: `Alibaba · Live ScrapingBee (${config.stealthProxy ? 'stealth' : 'premium'})`
		});

		return json({ report, creditsUsed, familiesScraped });
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : 'ScrapingBee scrape failed' },
			{ status: 500 }
		);
	}
};
