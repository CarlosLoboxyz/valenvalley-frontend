import { buildRecommendationsWorkbookBuffer } from '$lib/modules/export-report';
import type { SourcingReport } from '$lib/types/sourcing';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, url }) => {
	const format = url.searchParams.get('format') ?? 'xlsx';
	const report = (await request.json()) as SourcingReport;

	if (format === 'json') {
		return new Response(JSON.stringify(report, null, 2), {
			headers: {
				'Content-Type': 'application/json',
				'Content-Disposition': 'attachment; filename="final_recommendations.json"'
			}
		});
	}

	const buffer = buildRecommendationsWorkbookBuffer(report);
	return new Response(buffer, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': 'attachment; filename="final_recommendations.xlsx"'
		}
	});
};
