export const locales = ['hu', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'hu';

export function isLocale(value: unknown): value is Locale {
	return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

/** Picks the best supported locale from an Accept-Language header, or null. */
export function parseAcceptLanguage(header: string | null | undefined): Locale | null {
	if (!header) return null;
	const ranked = header
		.split(',')
		.map((part, index) => {
			const [tag, ...params] = part.trim().split(';');
			const qParam = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
			const q = qParam ? Number(qParam.slice(2)) : 1;
			return {
				primary: tag.trim().toLowerCase().split('-')[0],
				q: Number.isNaN(q) ? 0 : q,
				index
			};
		})
		.filter((entry) => entry.q > 0)
		.sort((a, b) => b.q - a.q || a.index - b.index);
	for (const entry of ranked) {
		if (isLocale(entry.primary)) return entry.primary;
	}
	return null;
}

export type ResolveInput = {
	userSetting?: string | null;
	cookie?: string | null;
	acceptLanguage?: string | null;
	followBrowser?: boolean;
};

/** Order: saved user setting, locale cookie, (optionally) browser language, default. */
export function resolveLocale(input: ResolveInput): Locale {
	if (isLocale(input.userSetting)) return input.userSetting;
	if (isLocale(input.cookie)) return input.cookie;
	if (input.followBrowser) {
		const fromBrowser = parseAcceptLanguage(input.acceptLanguage);
		if (fromBrowser) return fromBrowser;
	}
	return defaultLocale;
}
