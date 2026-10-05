import { describe, expect, it } from 'vitest';
import { formatWeight, gramsToKg, gramsToLb, kgToGrams, lbToGrams } from './units.ts';

describe('units', () => {
	it('converts grams to kg', () => {
		expect(gramsToKg(4250)).toBe(4.25);
	});

	it('converts grams to lb', () => {
		expect(gramsToLb(4536)).toBeCloseTo(10, 2);
	});

	it('converts kg to whole grams', () => {
		expect(kgToGrams(4.25)).toBe(4250);
	});

	it('converts lb to whole grams', () => {
		expect(lbToGrams(1)).toBe(454);
	});

	it('round-trips kg through grams', () => {
		expect(gramsToKg(kgToGrams(12.345))).toBeCloseTo(12.345, 3);
	});

	it('formats weights with the unit', () => {
		expect(formatWeight(4250, 'kg')).toBe('4.25 kg');
		expect(formatWeight(4536, 'lb')).toBe('10.00 lb');
	});
});
