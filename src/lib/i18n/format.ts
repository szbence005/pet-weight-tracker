import type { Locale } from './locale.ts';

/** Shows a stored YYYY-MM-DD date in the language of the user (no time zone shift). */
export function formatDate(isoDate: string, locale: Locale): string {
	const tag = locale === 'hu' ? 'hu-HU' : 'en-GB';
	return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString(tag, {
		dateStyle: 'medium',
		timeZone: 'UTC'
	});
}
