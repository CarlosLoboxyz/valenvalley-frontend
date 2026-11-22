import { errorResponse, readObject, withBackend } from '$lib/server/backend-proxy';
import type { RequestHandler } from './$types';

const GRANULARITIES = ['fine', 'balanced', 'broad'];

/**
 * `POST /api/backend/jobs` → inicia un scrape que GASTA créditos.
 * `confirm: true` es el reconocimiento explícito del usuario; sin él no se llama al backend.
 */
export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	const body = await readObject(request);
	if (!body || typeof body.rfqFileId !== 'string' || !body.rfqFileId) {
		return errorResponse(400, 'bad_request', 'rfqFileId required');
	}
	if (body.confirm !== true) {
		return errorResponse(
			400,
			'credit_confirmation_required',
			'The user must confirm the credit spend'
		);
	}
	const rfqFileId = body.rfqFileId;
	const granularity =
		typeof body.granularity === 'string' && GRANULARITIES.includes(body.granularity)
			? body.granularity
			: null;
	const pages = Number.isInteger(body.pages) ? (body.pages as number) : 1;
	return withBackend({ locals, cookies }, (client) =>
		client.startScrape({
			rfq_file_id: rfqFileId,
			granularity,
			pages,
			stealth: body.stealth === true,
			confirm_credit_spend: true
		})
	);
};
