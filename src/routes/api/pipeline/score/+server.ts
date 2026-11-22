import { json } from '@sveltejs/kit';
import { DEFAULT_PIPELINE_CONFIG } from '$lib/config/pipeline-config';
import { buildSourcingReport } from '$lib/modules/rfq-processor';
import type { FamilyScrapeCache, PipelineConfig, ProductFamily, RfqItem } from '$lib/types/sourcing';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = (await request.json()) as {
			rfqItems: RfqItem[];
			cache: FamilyScrapeCache;
			config?: PipelineConfig;
			existingFamilies?: ProductFamily[];
			catalogName?: string;
		};

		if (!Array.isArray(body.rfqItems)) {
			return json({ error: 'rfqItems array is required' }, { status: 400 });
		}

		const report = buildSourcingReport({
			rfqItems: body.rfqItems,
			cache: body.cache ?? {},
			config: body.config ?? DEFAULT_PIPELINE_CONFIG,
			existingFamilies: body.existingFamilies,
			catalogName: body.catalogName
		});

		return json({ report });
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : 'Failed to score recommendations' },
			{ status: 500 }
		);
	}
};
