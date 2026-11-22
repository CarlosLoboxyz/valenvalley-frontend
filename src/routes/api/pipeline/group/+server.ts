import { json } from '@sveltejs/kit';
import { calculateCreditEstimate } from '$lib/modules/cost-estimator';
import { groupProductsIntoFamilies } from '$lib/modules/family-grouper';
import type { Granularity, RfqItem } from '$lib/types/sourcing';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = (await request.json()) as {
			rfqItems: RfqItem[];
			granularity?: Granularity;
			pagesPerFamily?: number;
			stealthProxy?: boolean;
		};

		if (!Array.isArray(body.rfqItems)) {
			return json({ error: 'rfqItems array is required' }, { status: 400 });
		}

		const granularity = body.granularity ?? 'balanced';
		const { families } = groupProductsIntoFamilies(body.rfqItems, granularity);
		const creditEstimate = calculateCreditEstimate({
			totalProducts: body.rfqItems.length,
			familyCount: families.length,
			pagesPerFamily: body.pagesPerFamily ?? 1,
			stealthProxy: Boolean(body.stealthProxy)
		});

		return json({ families, creditEstimate });
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : 'Failed to group RFQ items' },
			{ status: 500 }
		);
	}
};
