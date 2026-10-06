import type { Locale } from './i18n/locale.ts';

export type WeightUnit = 'g' | 'kg';

export function gramsToKg(grams: number): number {
	return grams / 1000;
}

// Form input (kg, may be fractional) -> value stored in the database (whole grams).
export function kgToGrams(kg: number): number {
	return Math.round(kg * 1000);
}

// Shown to the user: "4250 g" or "4,25 kg" (at most 3 decimals). The decimal comma is
// Hungarian; English uses a decimal point.
export function formatWeight(grams: number, unit: WeightUnit, locale: Locale = 'hu'): string {
	if (unit === 'g') return `${grams} g`;
	const kg = Number(gramsToKg(grams).toFixed(3));
	const text = String(kg);
	return `${locale === 'hu' ? text.replace('.', ',') : text} kg`;
}
