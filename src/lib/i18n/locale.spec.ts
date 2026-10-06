import { describe, it, expect } from 'vitest';
import { isLocale, parseAcceptLanguage, resolveLocale } from './locale.ts';

describe('isLocale', () => {
	it('accepts only supported locales', () => {
		expect(isLocale('hu')).toBe(true);
		expect(isLocale('en')).toBe(true);
		expect(isLocale('de')).toBe(false);
		expect(isLocale(null)).toBe(false);
		expect(isLocale(undefined)).toBe(false);
	});
});

describe('parseAcceptLanguage', () => {
	it('picks the first supported language by quality', () => {
		expect(parseAcceptLanguage('en-US,en;q=0.9')).toBe('en');
		expect(parseAcceptLanguage('hu-HU,hu;q=0.9,en;q=0.8')).toBe('hu');
		expect(parseAcceptLanguage('de,en;q=0.5,hu;q=0.8')).toBe('hu');
	});

	it('returns null when nothing is supported or the header is missing', () => {
		expect(parseAcceptLanguage('de,fr;q=0.8')).toBeNull();
		expect(parseAcceptLanguage('')).toBeNull();
		expect(parseAcceptLanguage(null)).toBeNull();
	});

	it('ignores q=0 and broken q values', () => {
		expect(parseAcceptLanguage('en;q=0, hu')).toBe('hu');
		expect(parseAcceptLanguage('en;q=abc,hu;q=0.5')).toBe('hu');
	});
});

describe('resolveLocale', () => {
	it('the saved user setting wins over the cookie', () => {
		expect(resolveLocale({ userSetting: 'en', cookie: 'hu' })).toBe('en');
	});

	it('an invalid user setting falls back to the cookie', () => {
		expect(resolveLocale({ userSetting: 'xx', cookie: 'en' })).toBe('en');
	});

	it('an invalid cookie is ignored', () => {
		expect(resolveLocale({ cookie: 'xx' })).toBe('hu');
	});

	it('uses the browser language only when asked to', () => {
		expect(resolveLocale({ acceptLanguage: 'en-US,en;q=0.9' })).toBe('hu');
		expect(resolveLocale({ acceptLanguage: 'en-US,en;q=0.9', followBrowser: true })).toBe('en');
	});

	it('defaults to Hungarian', () => {
		expect(resolveLocale({})).toBe('hu');
		expect(resolveLocale({ acceptLanguage: 'de', followBrowser: true })).toBe('hu');
	});
});
