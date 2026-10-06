import { describe, it, expect } from 'vitest';
import { ageText } from './age.ts';
import { getT } from './i18n/index.ts';

const NOW = new Date(2026, 9, 20);
const en = getT('en');
const hu = getT('hu');

describe('ageText', () => {
	it('says under a month for a newborn', () => {
		expect(ageText('2026-10-10', en, NOW)).toBe('under 1 month old');
	});

	it('handles exactly one month', () => {
		expect(ageText('2026-09-10', en, NOW)).toBe('1 month old');
	});

	it('counts months below a year', () => {
		expect(ageText('2026-05-10', en, NOW)).toBe('5 months old');
	});

	it('handles exactly one year', () => {
		expect(ageText('2025-10-10', en, NOW)).toBe('1 year old');
	});

	it('counts full years', () => {
		expect(ageText('2020-05-15', en, NOW)).toBe('6 years old');
	});

	it('speaks Hungarian with the Hungarian dictionary', () => {
		expect(ageText('2020-05-15', hu, NOW)).toBe('6 \u00e9ves');
	});
});
