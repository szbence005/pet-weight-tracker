import { fail } from '@sveltejs/kit';
import { ORIGIN } from '$app/env/private';
import { auth } from '#lib/server/auth.ts';
import { getT } from '#lib/i18n/index.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const t = getT(locals.locale);
		const data = await request.formData();
		const email = data.get('email')?.toString().trim() ?? '';

		if (!email) {
			return fail(400, { email, message: t('forgot.error.missing') });
		}

		try {
			await auth.api.requestPasswordReset({
				body: { email, redirectTo: new URL('/reset-password', ORIGIN).toString() }
			});
		} catch (error) {
			// Always show the same result, so it cannot be found out whether the address exists.
			console.error('Password reset request failed', error);
		}

		return { sent: true, email };
	}
};
