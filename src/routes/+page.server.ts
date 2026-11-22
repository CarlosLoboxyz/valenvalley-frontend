import { env } from '$env/dynamic/private';
import { loadConfigFromEnv } from '$lib/config/pipeline-config';
import { createInitialSourcingReport } from '$lib/data/sample-report';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { pipeline } = loadConfigFromEnv(env);
	const report = createInitialSourcingReport();
	report.config = pipeline;

	return {
		initialReport: report,
		hasApiKey: Boolean(env.SCRAPINGBEE_API_KEY && env.SCRAPINGBEE_API_KEY !== 'your_api_key_here')
	};
};
