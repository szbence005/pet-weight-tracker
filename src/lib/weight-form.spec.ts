import { describe, expect, it } from 'vitest';
import { parseWeightForm } from './weight-form.ts';

const TODAY = '2026-06-15';

function form(fields: Record<string, string>) {
	const fd = new FormData();
	for (const [key, value] of Object.entries(fields)) fd.set(key, value);
	return fd;
}

describe('parseWeightForm', () => {
	it('parses kilograms with a decimal comma', () => {
		const r = parseWeightForm(
			form({ weight: '4,25', unit: 'kg', measuredAt: '2026-06-01' }),
			TODAY
		);
		expect(r).toEqual({
			ok: true,
			value: { weightGrams: 4250, measuredAt: '2026-06-01', note: null }
		});
	});

	it('parses kilograms with a decimal point', () => {
		const r = parseWeightForm(
			form({ weight: '4.25', unit: 'kg', measuredAt: '2026-06-01' }),
			TODAY
		);
		expect(r.ok && r.value.weightGrams).toBe(4250);
	});

	it('parses grams', () => {
		const r = parseWeightForm(form({ weight: '4250', unit: 'g', measuredAt: '2026-06-01' }), TODAY);
		expect(r.ok && r.value.weightGrams).toBe(4250);
	});

	it('rejects zero, negative and non-numeric weights', () => {
		for (const weight of ['0', '-1', 'abc', '']) {
			const r = parseWeightForm(form({ weight, unit: 'kg', measuredAt: '2026-06-01' }), TODAY);
			expect(r.ok).toBe(false);
		}
	});

	it('rejects an absurdly large weight', () => {
		const r = parseWeightForm(
			form({ weight: '9999', unit: 'kg', measuredAt: '2026-06-01' }),
			TODAY
		);
		expect(r.ok).toBe(false);
	});

	it('rejects a future or invalid date', () => {
		for (const measuredAt of ['2026-06-16', '2026-02-31', 'nope', '']) {
			const r = parseWeightForm(form({ weight: '4', unit: 'kg', measuredAt }), TODAY);
			expect(r.ok).toBe(false);
		}
	});

	it('returns the typed values on error so the form can be refilled', () => {
		const r = parseWeightForm(
			form({ weight: 'x', unit: 'g', measuredAt: '2026-06-01', note: 'n' }),
			TODAY
		);
		expect(r.ok).toBe(false);
		if (!r.ok)
			expect(r.values).toEqual({ weight: 'x', unit: 'g', measuredAt: '2026-06-01', note: 'n' });
	});
});
