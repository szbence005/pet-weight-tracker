import type { Handle } from '@sveltejs/kit/hooks';
import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/env';
import { auth } from '#lib/server/auth.ts';
import { resolveLocale } from '#lib/i18n/locale.ts';
import { getUserLocale } from '#lib/server/user-settings.ts';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

// Order: saved user setting, locale cookie, browser language, Hungarian.
// A database problem must never break the page, so it falls back to the cookie.
const handleLocale: Handle = async ({ event, resolve }) => {
	let userSetting: string | null = null;
	if (event.locals.user) {
		try {
			userSetting = await getUserLocale(event.locals.user.id);
		} catch (error) {
			console.error('Could not load the user locale', error);
		}
	}

	const locale = resolveLocale({
		userSetting,
		cookie: event.cookies.get('locale'),
		acceptLanguage: event.request.headers.get('accept-language'),
		followBrowser: true
	});
	event.locals.locale = locale;

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', locale)
	});
};

export const handle: Handle = sequence(handleBetterAuth, handleLocale);
