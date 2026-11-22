import { errorResponse, isJobId, withBackend } from '$lib/server/backend-proxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ params, locals, cookies }) => {
	if (!isJobId(params.id)) return errorResponse(404, 'job_not_found', 'Job not found');
	return withBackend({ locals, cookies }, (client) => client.cancelJob(params.id));
};
