import { kgToGrams } from './units.ts';
import { getT, type Translate } from './i18n/index.ts';

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

// "t" decides the language of the error messages (Hungarian by default).
export function parseWeightForm(
	formData: FormData,
	today: string = new Date().toISOString().slice(0, 10),
	t: Translate = getT('hu')
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
		errors.weight = t('weight.error.number');
	} else {
		weightGrams = unit === 'g' ? Math.round(Number(raw)) : kgToGrams(Number(raw));
		if (weightGrams <= 0) errors.weight = t('weight.error.zero');
		else if (weightGrams > MAX_GRAMS) errors.weight = t('weight.error.tooBig');
	}

	if (!isRealDate(values.measuredAt)) errors.measuredAt = t('weight.error.date');
	else if (values.measuredAt > today) errors.measuredAt = t('weight.error.dateFuture');

	if (values.note.length > MAX_NOTE) {
		errors.note = t('weight.error.noteTooLong', { max: MAX_NOTE });
	}

	if (Object.keys(errors).length > 0) return { ok: false, errors, values };

	return {
		ok: true,
		value: { weightGrams, measuredAt: values.measuredAt, note: values.note || null }
	};
}
