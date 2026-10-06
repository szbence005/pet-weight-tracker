import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { userSettings } from '#lib/server/db/schema.ts';
import { isLocale, type Locale } from '#lib/i18n/locale.ts';

/** The saved UI language of a user, or null when nothing (valid) is saved. */
export async function getUserLocale(userId: string): Promise<Locale | null> {
	const [row] = await db
		.select({ locale: userSettings.locale })
		.from(userSettings)
		.where(eq(userSettings.userId, userId))
		.limit(1);
	return row && isLocale(row.locale) ? row.locale : null;
}

/** Saves the UI language. The user id must come from the session, never from the request. */
export async function setUserLocale(userId: string, locale: string): Promise<boolean> {
	if (!isLocale(locale)) return false;
	await db
		.insert(userSettings)
		.values({ userId, locale })
		.onConflictDoUpdate({
			target: userSettings.userId,
			set: { locale, updatedAt: new Date() }
		});
	return true;
}
