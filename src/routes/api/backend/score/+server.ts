import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { loadBackendConfig, pipelineConfigFromBackend } from '$lib/config/backend';
import { BackendClient, BackendHttpError } from '$lib/services/backend/client';
import { adaptScoreResponse } from '$lib/services/backend/adapter';
import type { PipelineConfig } from '$lib/types/sourcing';
import type { RequestHandler } from './$types';

/**
 * Proxy server-side para `POST /api/v1/recommendations/score` (0 créditos).
 *
 * El navegador NUNCA habla con el backend directo ni ve el token de PocketBase:
 * llama a esta ruta (SvelteKit) y aquí se reenvía con el token Bearer del usuario en sesión.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const config = loadBackendConfig(env, locals.pbToken);
	if (!config.enabled) {
		return json(
			{ error: { code: 'backend_disabled', detail: 'BACKEND_URL is not configured' } },
			{ status: 503 }
		);
	}

	let payload: { config?: PipelineConfig; positions?: string | null };
	try {
		payload = await request.json();
	} catch {
		return json({ error: { code: 'bad_request', detail: 'JSON body expected' } }, { status: 400 });
	}

	const pipeline = payload.config;
	if (!pipeline) {
		return json({ error: { code: 'bad_request', detail: 'config required' } }, { status: 400 });
	}

	const client = new BackendClient(config);
	try {
		// Config pública para reflejar los defaults vigentes del backend si no llegan del cliente.
		const effectiveConfig = (await client.publicConfig().catch(() => null)) ?? null;
		const base = effectiveConfig ? pipelineConfigFromBackend(effectiveConfig) : pipeline;

		const scoreRequest = {
			rfq_file_id: 'default',
			granularity: pipeline.granularity,
			limit: null,
			positions: payload.positions ?? null,
			top_n: pipeline.topN,
			require_trade_assurance: pipeline.filters.requireTradeAssurance,
			min_years: pipeline.filters.minYears,
			max_price: pipeline.filters.maxPriceOverride,
			strict_moq: pipeline.filters.strictMoq,
			strict_certs: pipeline.filters.strictCerts,
			strict_min_price: pipeline.filters.strictMinPrice,
			required_certs: pipeline.filters.requiredCerts,
			weight_price: pipeline.weights.price,
			weight_moq: pipeline.weights.moq,
			weight_trade_assurance: pipeline.weights.tradeAssurance,
			weight_years: pipeline.weights.years,
			weight_certs: pipeline.weights.certs,
			weight_vendor_score: pipeline.weights.vendorScore,
			weight_rfq_fit: pipeline.weights.rfqFit,
			persist_artifacts: true
		};

		const scored = await client.recommendationsScore(scoreRequest);
		const report = adaptScoreResponse(scored, base);
		return json({
			report,
			persisted: scored.persisted,
			credits_consumed: scored.credits_consumed
		});
	} catch (err) {
		const status = err instanceof BackendHttpError ? err.status : 502;
		const code = err instanceof BackendHttpError ? err.code : 'upstream_unavailable';
		const detail =
			err instanceof BackendHttpError ? err.detail : err instanceof Error ? err.message : 'backend call failed';
		return json({ error: { code, detail } }, { status });
	}
};
