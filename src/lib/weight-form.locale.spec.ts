import { describe, it, expect } from 'vitest';
import { parseWeightForm } from './weight-form.ts';
import { getT } from './i18n/index.ts';

const TODAY = '2026-06-15';

function form(fields: Record<string, string>) {
	const fd = new FormData();
	for (const [key, value] of Object.entries(fields)) fd.set(key, value);
	return fd;
}

describe('parseWeightForm languages', () => {
	it('writes an English message for a bad weight', () => {
		const r = parseWeightForm(
			form({ weight: 'abc', unit: 'kg', measuredAt: '2026-06-01' }),
			TODAY,
			getT('en')
		);
		expect(!r.ok && r.errors.weight).toBe('Enter a positive number (e.g. 4.25).');
	});

	it('writes an English message for a future date', () => {
		const r = parseWeightForm(
			form({ weight: '4', unit: 'kg', measuredAt: '2026-06-16' }),
			TODAY,
			getT('en')
		);
		expect(!r.ok && r.errors.measuredAt).toBe('The date cannot be in the future.');
	});

	it('puts the note limit into the message', () => {
		const r = parseWeightForm(
			form({ weight: '4', unit: 'kg', measuredAt: '2026-06-01', note: 'a'.repeat(201) }),
			TODAY,
			getT('en')
		);
		expect(!r.ok && r.errors.note).toBe('At most 200 characters.');
	});

	it('stays Hungarian by default', () => {
		const r = parseWeightForm(form({ weight: 'abc', unit: 'kg', measuredAt: '2026-06-01' }), TODAY);
		expect(!r.ok && r.errors.weight).toBe('Adj meg egy pozit\u00edv sz\u00e1mot (pl. 4,25).');
	});
});
