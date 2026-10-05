import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '#lib/server/auth.ts';
import type { Actions, PageServerLoad } from './$types';

const MIN_PASSWORD_LENGTH = 8;

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, '/pets');
	return {};
};

export const actions: Actions = {
	signIn: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString().trim() ?? '';
		const password = data.get('password')?.toString() ?? '';

		if (!email || !password) {
			return fail(400, {
				action: 'signIn',
				email,
				message: 'Add meg az e-mail címet és a jelszót.'
			});
		}

		try {
			await auth.api.signInEmail({ body: { email, password } });
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, {
					action: 'signIn',
					email,
					message: 'Hibás e-mail cím vagy jelszó.'
				});
			}
			return fail(500, { action: 'signIn', email, message: 'Váratlan hiba történt.' });
		}

		redirect(303, '/pets');
	},

	signUp: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString().trim() ?? '';
		const email = data.get('email')?.toString().trim() ?? '';
		const password = data.get('password')?.toString() ?? '';

		if (!name || !email) {
			return fail(400, {
				action: 'signUp',
				email,
				message: 'A név és az e-mail cím megadása kötelező.'
			});
		}
		if (password.length < MIN_PASSWORD_LENGTH) {
			return fail(400, {
				action: 'signUp',
				email,
				message: `A jelszó legalább ${MIN_PASSWORD_LENGTH} karakter legyen.`
			});
		}

		try {
			await auth.api.signUpEmail({ body: { name, email, password } });
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, {
					action: 'signUp',
					email,
					message: 'A regisztráció nem sikerült. Lehet, hogy ez az e-mail cím már használatban van.'
				});
			}
			return fail(500, { action: 'signUp', email, message: 'Váratlan hiba történt.' });
		}

		redirect(303, '/pets');
	}
};
