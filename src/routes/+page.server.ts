import { env } from '$env/dynamic/private';
import { loadBackendConfig, pipelineConfigFromBackend } from '$lib/config/backend';
import { loadConfigFromEnv } from '$lib/config/pipeline-config';
import { createInitialSourcingReport } from '$lib/data/sample-report';
import { BackendClient } from '$lib/services/backend/client';
import { adaptScoreResponse } from '$lib/services/backend/adapter';
import type { PageServerLoad } from './$types';

export type ReportSource = 'backend' | 'sample';

/** Origen del reporte inicial: `backend` si FastAPI está configurado y responde; `sample` si no. */
function sampleReport() {
	const { pipeline } = loadConfigFromEnv(env);
	const report = createInitialSourcingReport();
	report.config = pipeline;
	return report;
}

export const load: PageServerLoad = async () => {
	const backend = loadBackendConfig(env);

	if (!backend.enabled) {
		return {
			initialReport: sampleReport(),
			reportSource: 'sample' as ReportSource,
			hasApiKey: Boolean(
				env.SCRAPINGBEE_API_KEY && env.SCRAPINGBEE_API_KEY !== 'your_api_key_here'
			)
		};
	}

	const client = new BackendClient(backend);
	try {
		// Config pública (sin secretos) → defaults de filtros/pesos vigentes.
		const publicConfig = await client.publicConfig();
		const pipeline = pipelineConfigFromBackend(publicConfig);

		// Prefiere el último run persistido; si no hay, ejecuta un score 0-créditos con el RFQ por defecto.
		const latest = await client.recommendationsLatest();
		const report =
			latest.exists && latest.result
				? adaptScoreResponse(latest.result, pipeline)
				: adaptScoreResponse(
						await client.recommendationsScore({
							rfq_file_id: 'default',
							granularity: pipeline.granularity,
							persist_artifacts: true
						}),
						pipeline
					);

		return { initialReport: report, reportSource: 'backend' as ReportSource };
	} catch {
		// No silencioso: se expone el fallo para que la UI lo muestre, sin inventar datos.
		return {
			initialReport: sampleReport(),
			reportSource: 'sample' as ReportSource,
			backendError: true,
			hasApiKey: Boolean(
				env.SCRAPINGBEE_API_KEY && env.SCRAPINGBEE_API_KEY !== 'your_api_key_here'
			)
		};
	}
};
