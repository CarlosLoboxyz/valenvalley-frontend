import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { loadBackendConfig, pipelineConfigFromBackend } from '$lib/config/backend';
import { clearSessionCookie, forgetToken } from '$lib/server/session';
import { adaptScoreResponse } from '$lib/services/backend/adapter';
import { BackendClient, BackendHttpError } from '$lib/services/backend/client';
import type { LatestResponse } from '$lib/services/backend/types';
import type { PipelineConfig } from '$lib/types/sourcing';
import type { PageServerLoad } from './$types';

/**
 * Dashboard del último análisis del usuario.
 *
 * - Sin análisis guardado → onboarding en `/materiales` (nunca se puntúa una lista por defecto).
 * - Backend sin configurar o caído → estado `unavailable` explícito; no se inventan datos.
 */
export const load: PageServerLoad = async ({ locals, cookies, url }) => {
	const backend = loadBackendConfig(env, locals.pbToken);
	if (!backend.enabled) {
		return { status: 'unavailable' as const, reason: 'not_configured' as const };
	}

	const client = new BackendClient(backend);
	let pipeline: PipelineConfig;
	let latest: LatestResponse;
	try {
		pipeline = pipelineConfigFromBackend(await client.publicConfig());
		latest = await client.recommendationsLatest();
	} catch (err) {
		// Token rechazado por el backend: la sesión ya no es válida, se vuelve al login.
		if (err instanceof BackendHttpError && err.status === 401) {
			if (locals.pbToken) forgetToken(locals.pbToken);
			clearSessionCookie(cookies);
			throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
		}
		return { status: 'unavailable' as const, reason: 'backend_error' as const };
	}

	if (!latest.exists || !latest.result) throw redirect(303, '/materiales');

	try {
		return {
			status: 'ready' as const,
			initialReport: adaptScoreResponse(latest.result, pipeline)
		};
	} catch {
		return { status: 'unavailable' as const, reason: 'backend_error' as const };
	}
};
