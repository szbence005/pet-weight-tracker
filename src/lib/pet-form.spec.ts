import { describe, expect, it } from 'vitest';
import { parsePetForm } from './pet-form.ts';

const TODAY = '2026-10-05';

function formOf(fields: Record<string, string>) {
	const form = new FormData();
	for (const [key, value] of Object.entries(fields)) form.set(key, value);
	return form;
}

describe('parsePetForm', () => {
	it('accepts a minimal form and turns empty optional fields into null', () => {
		const result = parsePetForm(formOf({ name: 'Rex', species: 'kutya' }), TODAY);
		expect(result).toEqual({
			ok: true,
			value: { name: 'Rex', species: 'kutya', breed: null, birthDate: null, notes: null }
		});
	});

	it('trims whitespace', () => {
		const result = parsePetForm(formOf({ name: '  Rex  ', species: 'kutya' }), TODAY);
		expect(result.ok && result.value.name).toBe('Rex');
	});

	it('requires a name', () => {
		const result = parsePetForm(formOf({ name: '   ', species: 'kutya' }), TODAY);
		expect(!result.ok && result.errors.name).toBeTruthy();
	});

	it('rejects a name that is too long', () => {
		const result = parsePetForm(formOf({ name: 'a'.repeat(61), species: 'kutya' }), TODAY);
		expect(!result.ok && result.errors.name).toBeTruthy();
	});

	it('rejects a species that is not in the list', () => {
		const result = parsePetForm(formOf({ name: 'Rex', species: 'sárkány' }), TODAY);
		expect(!result.ok && result.errors.species).toBeTruthy();
	});

	it('rejects a date that does not exist', () => {
		const result = parsePetForm(
			formOf({ name: 'Rex', species: 'kutya', birthDate: '2026-02-30' }),
			TODAY
		);
		expect(!result.ok && result.errors.birthDate).toBeTruthy();
	});

	it('rejects a birth date in the future', () => {
		const result = parsePetForm(
			formOf({ name: 'Rex', species: 'kutya', birthDate: '2026-10-06' }),
			TODAY
		);
		expect(!result.ok && result.errors.birthDate).toBeTruthy();
	});

	it('accepts today as a birth date', () => {
		const result = parsePetForm(formOf({ name: 'Rex', species: 'kutya', birthDate: TODAY }), TODAY);
		expect(result.ok).toBe(true);
	});

	it('returns the entered values when the form is invalid', () => {
		const result = parsePetForm(formOf({ name: '', species: 'kutya', breed: 'puli' }), TODAY);
		expect(!result.ok && result.values.breed).toBe('puli');
	});
});
