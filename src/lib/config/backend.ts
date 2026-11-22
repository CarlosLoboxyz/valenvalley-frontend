/**
 * Configuración del backend FastAPI (`valenvalley-alibaba`).
 *
 * El frontend llama al backend SÓLO desde el servidor (rutas `+server.ts` y `+page.server.ts`),
 * de modo que el token Bearer de PocketBase nunca llega al navegador.
 *
 * - `BACKEND_URL`      — base del API, p. ej. `http://localhost:8000` (sin `/api/v1`).
 * - El token Bearer es el de PocketBase del usuario en sesión (`locals.pbToken`), por petición.
 * - `BACKEND_TIMEOUT_MS` — timeout por llamada.
 *
 * Si `BACKEND_URL` no está definida, el backend se considera deshabilitado y la app
 * usa los datos de demostración locales (visible, no silencioso).
 */

import type { PipelineConfig } from '$lib/types/sourcing';
import type { PublicConfig } from '$lib/services/backend/types';

export interface BackendConfig {
	enabled: boolean;
	baseUrl: string;
	/** Token Bearer de PocketBase del usuario en sesión (vacío = el backend responde 401). */
	authToken: string;
	timeoutMs: number;
}

const DEFAULT_TIMEOUT_MS = 8000;

export function loadBackendConfig(
	env: Record<string, string | undefined>,
	authToken: string | null = null
): BackendConfig {
	const rawUrl = (env.BACKEND_URL ?? '').trim();
	const enabled = rawUrl !== '';
	return {
		enabled,
		baseUrl: enabled ? rawUrl.replace(/\/+$/, '') : '',
		authToken: (authToken ?? '').trim(),
		timeoutMs: numberFrom(env.BACKEND_TIMEOUT_MS, DEFAULT_TIMEOUT_MS)
	};
}

function numberFrom(value: string | undefined, fallback: number): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function apiBase(config: BackendConfig): string {
	return `${config.baseUrl}/api/v1`;
}

/** Mapa `/config` (público) del backend a la `PipelineConfig` del frontend. */
export function pipelineConfigFromBackend(config: PublicConfig): PipelineConfig {
	const granularity = config.granularity === 'fine' || config.granularity === 'broad'
		? config.granularity
		: 'balanced';

	return {
		granularity,
		stealthProxy: config.stealth_default,
		pagesPerFamily: config.default_pages,
		maxProductsPerPage: config.max_products_per_page,
		topN: config.recommend_top_n,
		fromCache: true,
		dryRun: true,
		filters: {
			requiredCerts: config.filters.required_certs,
			minYears: config.filters.min_years,
			requireTradeAssurance: config.filters.require_trade_assurance,
			strictMoq: config.filters.strict_moq,
			strictCerts: config.filters.strict_certs,
			strictMinPrice: config.filters.strict_min_price,
			maxPriceOverride: null
		},
		weights: {
			price: config.weights.weight_price,
			moq: config.weights.weight_moq,
			tradeAssurance: config.weights.weight_trade_assurance,
			years: config.weights.weight_years,
			certs: config.weights.weight_certs,
			vendorScore: config.weights.weight_vendor_score,
			rfqFit: config.weights.weight_rfq_fit
		}
	};
}
