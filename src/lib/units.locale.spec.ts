import { describe, it, expect } from 'vitest';
import { formatWeight } from './units.ts';

describe('formatWeight languages', () => {
	it('uses a decimal comma by default and in Hungarian', () => {
		expect(formatWeight(4250, 'kg')).toBe('4,25 kg');
		expect(formatWeight(4250, 'kg', 'hu')).toBe('4,25 kg');
	});

	it('uses a decimal point in English', () => {
		expect(formatWeight(4250, 'kg', 'en')).toBe('4.25 kg');
	});

	it('does not change grams', () => {
		expect(formatWeight(4250, 'g', 'en')).toBe('4250 g');
	});
});
