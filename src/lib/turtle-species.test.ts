import { describe, expect, it } from 'vitest';
import { parsePetForm, SPECIES } from './pet-form.ts';
import { COMMON_TURTLE_COUNT, TURTLE_SPECIES } from './turtle-species.ts';

describe('TURTLE_SPECIES', () => {
	it('has unique names that fit the breed field (60 characters)', () => {
		const names = TURTLE_SPECIES.map((t) => t.name);
		expect(new Set(names).size).toBe(names.length);
		for (const name of names) expect(name.length).toBeLessThanOrEqual(60);
	});

	it('keeps the common species first and sorts the rest alphabetically', () => {
		expect(TURTLE_SPECIES[0].name).toBe('Vörösfülű ékszerteknős');
		const rest = TURTLE_SPECIES.slice(COMMON_TURTLE_COUNT).map((t) => t.name);
		expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b, 'hu')));
	});

	it('every suggestion is accepted by the pet form as a breed of a turtle', () => {
		expect(SPECIES[0]).toBe('teknős');
		for (const t of TURTLE_SPECIES) {
			const data = new FormData();
			data.set('name', 'Teszt');
			data.set('species', 'teknős');
			data.set('breed', t.name);
			expect(parsePetForm(data).ok).toBe(true);
		}
	});
});
