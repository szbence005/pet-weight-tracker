import { kgToGrams } from './units.ts';

export type WeightFormErrors = { weight?: string; measuredAt?: string; note?: string };

// Raw strings, used to refill the form after a failed submit.
export type WeightFormValues = {
	weight: string;
	unit: 'g' | 'kg';
	measuredAt: string;
	note: string;
};

export type WeightFormResult =
	| { ok: true; value: { weightGrams: number; measuredAt: string; note: string | null } }
	| { ok: false; errors: WeightFormErrors; values: WeightFormValues };

const MAX_GRAMS = 500_000; // 500 kg, well inside the integer column
const MAX_NOTE = 200;

function text(formData: FormData, key: string): string {
	const value = formData.get(key);
	return typeof value === 'string' ? value.trim() : '';
}

function isRealDate(s: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
	const d = new Date(`${s}T00:00:00Z`);
	return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function parseWeightForm(
	formData: FormData,
	today: string = new Date().toISOString().slice(0, 10)
): WeightFormResult {
	const unit = text(formData, 'unit') === 'g' ? 'g' : 'kg';
	const values: WeightFormValues = {
		weight: text(formData, 'weight'),
		unit,
		measuredAt: text(formData, 'measuredAt'),
		note: text(formData, 'note')
	};
	const errors: WeightFormErrors = {};

	// Accept a decimal comma as well as a decimal point.
	const raw = values.weight.replace(',', '.');
	let weightGrams = 0;
	if (!/^\d+(\.\d+)?$/.test(raw)) {
		errors.weight = 'Adj meg egy pozitív számot (pl. 4,25).';
	} else {
		weightGrams = unit === 'g' ? Math.round(Number(raw)) : kgToGrams(Number(raw));
		if (weightGrams <= 0) errors.weight = 'A súly legyen nagyobb nullánál.';
		else if (weightGrams > MAX_GRAMS) errors.weight = 'Ez a súly túl nagy (legfeljebb 500 kg).';
	}

	if (!isRealDate(values.measuredAt)) errors.measuredAt = 'Adj meg érvényes dátumot.';
	else if (values.measuredAt > today) errors.measuredAt = 'A dátum nem lehet a jövőben.';

	if (values.note.length > MAX_NOTE) errors.note = `Legfeljebb ${MAX_NOTE} karakter lehet.`;

	if (Object.keys(errors).length > 0) return { ok: false, errors, values };

	return {
		ok: true,
		value: { weightGrams, measuredAt: values.measuredAt, note: values.note || null }
	};
}
