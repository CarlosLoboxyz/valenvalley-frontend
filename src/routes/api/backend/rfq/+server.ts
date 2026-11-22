import type { RfqItemInput } from '$lib/services/backend/types';
import { errorResponse, readObject, withBackend } from '$lib/server/backend-proxy';
import type { RequestHandler } from './$types';

/** `POST /api/backend/rfq` → crea la lista de materiales del usuario (0 créditos). */
export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	const body = await readObject(request);
	const items = body?.items;
	if (!body || !Array.isArray(items) || items.length === 0) {
		return errorResponse(400, 'bad_request', 'items[] required');
	}
	const filename = typeof body.filename === 'string' && body.filename.trim() ? body.filename : null;
	return withBackend({ locals, cookies }, (client) =>
		client.createRfqItems(filename, items as RfqItemInput[])
	);
};
