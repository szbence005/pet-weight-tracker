import { fail } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '#lib/server/auth.ts';
import type { Actions, PageServerLoad } from './$types';

const MIN_PASSWORD_LENGTH = 8;

export const load: PageServerLoad = ({ url }) => {
	const token = url.searchParams.get('token');
	const error = url.searchParams.get('error');
	return { token: token ?? '', invalid: !token || Boolean(error) };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const token = data.get('token')?.toString() ?? '';
		const password = data.get('password')?.toString() ?? '';
		const confirm = data.get('confirm')?.toString() ?? '';

		if (!token) {
			return fail(400, { message: 'Hiányzik a visszaállító token. Kérj új linket.' });
		}
		if (password.length < MIN_PASSWORD_LENGTH) {
			return fail(400, {
				message: `A jelszó legalább ${MIN_PASSWORD_LENGTH} karakter legyen.`
			});
		}
		if (password !== confirm) {
			return fail(400, { message: 'A két jelszó nem egyezik.' });
		}

		try {
			await auth.api.resetPassword({ body: { newPassword: password, token } });
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: 'A link érvénytelen vagy lejárt. Kérj új linket.' });
			}
			return fail(500, { message: 'Váratlan hiba történt.' });
		}

		return { success: true };
	}
};
