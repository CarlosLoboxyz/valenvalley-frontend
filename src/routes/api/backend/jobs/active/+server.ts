import { withBackend } from '$lib/server/backend-proxy';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ locals, cookies }) =>
	withBackend({ locals, cookies }, (client) => client.activeJob());
