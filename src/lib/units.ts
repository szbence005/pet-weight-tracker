const GRAMS_PER_LB = 453.59237;

export type WeightUnit = 'kg' | 'lb';

export function gramsToKg(grams: number): number {
	return grams / 1000;
}

export function gramsToLb(grams: number): number {
	return grams / GRAMS_PER_LB;
}

// Form input -> value stored in the database (always whole grams).
export function kgToGrams(kg: number): number {
	return Math.round(kg * 1000);
}

export function lbToGrams(lb: number): number {
	return Math.round(lb * GRAMS_PER_LB);
}

export function formatWeight(grams: number, unit: WeightUnit): string {
	const value = unit === 'kg' ? gramsToKg(grams) : gramsToLb(grams);
	return `${value.toFixed(2)} ${unit}`;
}
