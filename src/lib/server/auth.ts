import { ORIGIN, BETTER_AUTH_SECRET } from '$app/env/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '#lib/server/db/index.ts';
import { sendMail } from '#lib/server/mail.ts';
import { resetPasswordEmail } from '#lib/server/mail-templates.ts';
import { getUserLocale } from '#lib/server/user-settings.ts';
import { resolveLocale, type Locale } from '#lib/i18n/locale.ts';

// Language of an email: the saved setting of the recipient, then the language of the
// current request (if there is one), then Hungarian.
async function emailLocale(userId: string): Promise<Locale> {
	let userSetting: string | null = null;
	try {
		userSetting = await getUserLocale(userId);
	} catch (error) {
		console.error('Could not load the recipient locale', error);
	}

	let requestLocale: string | null = null;
	try {
		requestLocale = getRequestEvent().locals.locale;
	} catch {
		// Not inside a request: fall back to the default.
	}

	return resolveLocale({ userSetting, cookie: requestLocale });
}

export const auth = betterAuth({
	baseURL: ORIGIN,
	secret: BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: {
		enabled: true,
		revokeSessionsOnPasswordReset: true,
		sendResetPassword: async ({ user, url }) => {
			try {
				const locale = await emailLocale(user.id);
				await sendMail({ to: user.email, ...resetPasswordEmail(user.name, url, locale) });
			} catch (error) {
				console.error('Reset email failed', error);
			}
		}
	},
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
