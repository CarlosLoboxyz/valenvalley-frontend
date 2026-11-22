import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { loadBackendConfig, pipelineConfigFromBackend } from '$lib/config/backend';
import { clearSessionCookie, forgetToken } from '$lib/server/session';
import { BackendClient, BackendHttpError } from '$lib/services/backend/client';
import type { JobStatus } from '$lib/services/backend/types';
import { MAX_RFQ_ITEMS } from '$lib/services/rfq-items';
import { limitsFromConfig } from '$lib/stores/onboarding.svelte';
import type { PageServerLoad } from './$types';

/**
 * Onboarding: configuración del backend (tarifas y topes de créditos) y, si el usuario ya
 * tiene un scrape en curso, el trabajo activo para retomar su progreso tras recargar.
 */
export const load: PageServerLoad = async ({ locals, cookies }) => {
	const backend = loadBackendConfig(env, locals.pbToken);
	if (!backend.enabled) {
		return { status: 'unavailable' as const, reason: 'not_configured' as const };
	}

	const client = new BackendClient(backend);
	try {
		const publicConfig = await client.publicConfig();
		let activeJob: JobStatus | null = null;
		try {
			activeJob = await client.activeJob();
		} catch (err) {
			if (err instanceof BackendHttpError && err.status === 401) throw err;
			// Sin el dato del trabajo activo se puede seguir: el backend impide duplicar con 409.
		}
		return {
			status: 'ready' as const,
			pipeline: pipelineConfigFromBackend(publicConfig),
			limits: limitsFromConfig(publicConfig, MAX_RFQ_ITEMS),
			activeJob,
			needsVerification: publicConfig.require_verified_email && !locals.user?.verified
		};
	} catch (err) {
		if (err instanceof BackendHttpError && err.status === 401) {
			if (locals.pbToken) forgetToken(locals.pbToken);
			clearSessionCookie(cookies);
			throw redirect(303, '/login?redirectTo=%2Fmateriales');
		}
		return { status: 'unavailable' as const, reason: 'backend_error' as const };
	}
};
