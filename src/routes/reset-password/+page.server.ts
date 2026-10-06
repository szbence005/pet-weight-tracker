import { fail } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '#lib/server/auth.ts';
import { getT } from '#lib/i18n/index.ts';
import type { Actions, PageServerLoad } from './$types';

const MIN_PASSWORD_LENGTH = 8;

export const load: PageServerLoad = ({ url }) => {
	const token = url.searchParams.get('token');
	const error = url.searchParams.get('error');
	return {
		token: token ?? '',
		invalid: !token || Boolean(error),
		minPasswordLength: MIN_PASSWORD_LENGTH
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const t = getT(locals.locale);
		const data = await request.formData();
		const token = data.get('token')?.toString() ?? '';
		const password = data.get('password')?.toString() ?? '';
		const confirm = data.get('confirm')?.toString() ?? '';

		if (!token) {
			return fail(400, { message: t('reset.error.noToken') });
		}
		if (password.length < MIN_PASSWORD_LENGTH) {
			return fail(400, {
				message: t('signup.error.passwordShort', { min: MIN_PASSWORD_LENGTH })
			});
		}
		if (password !== confirm) {
			return fail(400, { message: t('reset.error.mismatch') });
		}

		try {
			await auth.api.resetPassword({ body: { newPassword: password, token } });
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: t('reset.error.invalidLink') });
			}
			return fail(500, { message: t('error.unexpected') });
		}

		return { success: true };
	}
};
