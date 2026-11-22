import { errorResponse, readObject, withBackend } from '$lib/server/backend-proxy';
import type { RequestHandler } from './$types';

const GRANULARITIES = ['fine', 'balanced', 'broad'];

/** `POST /api/backend/group` → familias + estimado de créditos (0 créditos). */
export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	const body = await readObject(request);
	if (!body || typeof body.rfqFileId !== 'string' || !body.rfqFileId) {
		return errorResponse(400, 'bad_request', 'rfqFileId required');
	}
	const rfqFileId = body.rfqFileId;
	const granularity =
		typeof body.granularity === 'string' && GRANULARITIES.includes(body.granularity)
			? body.granularity
			: null;
	const pages = Number.isInteger(body.pages) ? (body.pages as number) : 1;
	return withBackend({ locals, cookies }, (client) =>
		client.rfqGroup({
			rfq_file_id: rfqFileId,
			granularity,
			pages,
			stealth: body.stealth === true
		})
	);
};
