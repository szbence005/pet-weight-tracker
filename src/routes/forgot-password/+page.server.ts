import { fail } from '@sveltejs/kit';
import { ORIGIN } from '$app/env/private';
import { auth } from '#lib/server/auth.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString().trim() ?? '';

		if (!email) {
			return fail(400, { email, message: 'Add meg az e-mail címedet.' });
		}

		try {
			await auth.api.requestPasswordReset({
				body: { email, redirectTo: new URL('/reset-password', ORIGIN).toString() }
			});
		} catch (error) {
			// A felhasználónak mindig ugyanazt mutatjuk, hogy ne derüljön ki, létezik-e a cím.
			console.error('Password reset request failed', error);
		}

		return { sent: true, email };
	}
};
