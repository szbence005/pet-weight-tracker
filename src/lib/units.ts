export type WeightUnit = 'g' | 'kg';

export function gramsToKg(grams: number): number {
	return grams / 1000;
}

// Form input (kg, may be fractional) -> value stored in the database (whole grams).
export function kgToGrams(kg: number): number {
	return Math.round(kg * 1000);
}

// Shown to the user: "4250 g" or "4,25 kg" (at most 3 decimals, decimal comma).
export function formatWeight(grams: number, unit: WeightUnit): string {
	if (unit === 'g') return `${grams} g`;
	const kg = Number(gramsToKg(grams).toFixed(3));
	return `${String(kg).replace('.', ',')} kg`;
}
