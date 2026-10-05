import { requireUser } from '#lib/server/auth-guard.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	const user = requireUser(locals);
	return { name: user.name };
};
