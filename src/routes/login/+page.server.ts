import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '#lib/server/auth.ts';
import { getT } from '#lib/i18n/index.ts';
import type { Actions, PageServerLoad } from './$types';

const MIN_PASSWORD_LENGTH = 8;

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, '/pets');
	return { minPasswordLength: MIN_PASSWORD_LENGTH };
};

export const actions: Actions = {
	signIn: async ({ request, locals }) => {
		const t = getT(locals.locale);
		const data = await request.formData();
		const email = data.get('email')?.toString().trim() ?? '';
		const password = data.get('password')?.toString() ?? '';

		if (!email || !password) {
			return fail(400, {
				action: 'signIn',
				email,
				message: t('login.error.missing')
			});
		}

		try {
			await auth.api.signInEmail({ body: { email, password } });
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, {
					action: 'signIn',
					email,
					message: t('login.error.invalid')
				});
			}
			return fail(500, { action: 'signIn', email, message: t('error.unexpected') });
		}

		redirect(303, '/pets');
	},

	signUp: async ({ request, locals }) => {
		const t = getT(locals.locale);
		const data = await request.formData();
		const name = data.get('name')?.toString().trim() ?? '';
		const email = data.get('email')?.toString().trim() ?? '';
		const password = data.get('password')?.toString() ?? '';

		if (!name || !email) {
			return fail(400, {
				action: 'signUp',
				email,
				message: t('signup.error.required')
			});
		}
		if (password.length < MIN_PASSWORD_LENGTH) {
			return fail(400, {
				action: 'signUp',
				email,
				message: t('signup.error.passwordShort', { min: MIN_PASSWORD_LENGTH })
			});
		}

		try {
			await auth.api.signUpEmail({ body: { name, email, password } });
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, {
					action: 'signUp',
					email,
					message: t('signup.error.failed')
				});
			}
			return fail(500, { action: 'signUp', email, message: t('error.unexpected') });
		}

		redirect(303, '/pets');
	}
};
