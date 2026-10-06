import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isLocale } from '#lib/i18n/locale.ts';
import { safeRedirectPath } from '#lib/i18n/redirect.ts';
import { setUserLocale } from '#lib/server/user-settings.ts';

// Saves the chosen language (cookie for everybody, database too when logged in).
export const POST: RequestHandler = async ({ request, cookies, locals }) => {
	const form = await request.formData();
	const locale = form.get('locale');
	const target = safeRedirectPath(form.get('redirectTo'));

	if (isLocale(locale)) {
		cookies.set('locale', locale, {
			path: '/',
			maxAge: 60 * 60 * 24 * 365,
			sameSite: 'lax',
			httpOnly: false
		});
		if (locals.user) {
			try {
				await setUserLocale(locals.user.id, locale);
			} catch (error) {
				console.error('Could not save the user locale', error);
			}
		}
	}

	redirect(303, target);
};
