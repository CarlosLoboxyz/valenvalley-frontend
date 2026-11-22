import { env } from '$env/dynamic/private';
import { loadBackendConfig, pipelineConfigFromBackend } from '$lib/config/backend';
import { loadConfigFromEnv } from '$lib/config/pipeline-config';
import { createInitialSourcingReport } from '$lib/data/sample-report';
import { BackendClient, BackendHttpError } from '$lib/services/backend/client';
import { adaptScoreResponse } from '$lib/services/backend/adapter';
import { forgetToken, clearSessionCookie } from '$lib/server/session';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export type ReportSource = 'backend' | 'sample';

/** Origen del reporte inicial: `backend` si FastAPI está configurado y responde; `sample` si no. */
function sampleReport() {
	const { pipeline } = loadConfigFromEnv(env);
	const report = createInitialSourcingReport();
	report.config = pipeline;
	return report;
}

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
	const backend = loadBackendConfig(env, locals.pbToken);

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
	} catch (err) {
		// Token rechazado por el backend: la sesión ya no es válida, se vuelve al login.
		if (err instanceof BackendHttpError && err.status === 401) {
			if (locals.pbToken) forgetToken(locals.pbToken);
			clearSessionCookie(cookies);
			throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
		}
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
