import { describe, expect, it } from 'vitest';
import { formatWeight, gramsToKg, kgToGrams } from './units.ts';

describe('units', () => {
	it('converts grams to kilograms as a fraction', () => {
		expect(gramsToKg(4250)).toBe(4.25);
	});

	it('converts kilograms to whole grams', () => {
		expect(kgToGrams(4.25)).toBe(4250);
	});

	it('rounds to whole grams', () => {
		expect(kgToGrams(4.2549)).toBe(4255);
	});

	it('formats kilograms with a decimal comma', () => {
		expect(formatWeight(4250, 'kg')).toBe('4,25 kg');
		expect(formatWeight(4255, 'kg')).toBe('4,255 kg');
	});

	it('formats whole kilograms without decimals', () => {
		expect(formatWeight(5000, 'kg')).toBe('5 kg');
	});

	it('formats grams', () => {
		expect(formatWeight(4250, 'g')).toBe('4250 g');
	});
});
