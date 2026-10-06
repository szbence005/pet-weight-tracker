import { describe, it, expect } from 'vitest';
import { parsePetForm, speciesLabel } from './pet-form.ts';
import { getT } from './i18n/index.ts';

const TODAY = '2026-10-05';

function formOf(fields: Record<string, string>) {
	const form = new FormData();
	for (const [key, value] of Object.entries(fields)) form.set(key, value);
	return form;
}

describe('parsePetForm languages', () => {
	it('writes English error messages when asked to', () => {
		const result = parsePetForm(formOf({ name: '', species: 'x' }), TODAY, getT('en'));
		expect(!result.ok && result.errors.name).toBe('Name is required.');
		expect(!result.ok && result.errors.species).toBe('Choose a species from the list.');
	});

	it('puts the limit into the message', () => {
		const result = parsePetForm(
			formOf({ name: 'a'.repeat(61), species: 'kutya' }),
			TODAY,
			getT('en')
		);
		expect(!result.ok && result.errors.name).toBe('The name can be at most 60 characters.');
	});

	it('stays Hungarian by default', () => {
		const result = parsePetForm(formOf({ name: '', species: 'kutya' }), TODAY);
		expect(!result.ok && result.errors.name).toBe('A n\u00e9v megad\u00e1sa k\u00f6telez\u0151.');
	});
});

describe('speciesLabel', () => {
	it('translates the stored Hungarian value and leaves unknown ones alone', () => {
		expect(speciesLabel('tekn\u0151s', getT('en'))).toBe('turtle');
		expect(speciesLabel('kutya', getT('hu'))).toBe('kutya');
		expect(speciesLabel('sark\u00e1ny', getT('en'))).toBe('sark\u00e1ny');
	});
});
