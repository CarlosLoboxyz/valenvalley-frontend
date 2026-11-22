import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => ({
	theme: locals.theme,
	locale: locals.locale,
	user: locals.user ? { email: locals.user.email } : null
});
