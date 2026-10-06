import { describe, expect, it } from 'vitest';
import { kindLabel, parseHabitatForm } from './habitat-form.ts';
import { getT } from './i18n/index.ts';

function form(entries: Record<string, string>) {
	const data = new FormData();
	for (const [key, value] of Object.entries(entries)) data.set(key, value);
	return data;
}

describe('parseHabitatForm', () => {
	it('accepts a valid habitat and turns empty notes into null', () => {
		const r = parseHabitatForm(form({ name: '  Nagy tó ', kind: 'pond', notes: '  ' }));
		expect(r).toEqual({ ok: true, value: { name: 'Nagy tó', kind: 'pond', notes: null } });
	});

	it('requires a name', () => {
		const r = parseHabitatForm(form({ name: ' ', kind: 'pond', notes: '' }));
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.errors.name).toBeTruthy();
	});

	it('rejects an unknown kind', () => {
		const r = parseHabitatForm(form({ name: 'X', kind: 'castle', notes: '' }));
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.errors.kind).toBeTruthy();
	});

	it('rejects a too long name and too long notes, and keeps what was typed', () => {
		const r = parseHabitatForm(
			form({ name: 'a'.repeat(61), kind: 'other', notes: 'b'.repeat(501) })
		);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.errors.name).toBeTruthy();
			expect(r.errors.notes).toBeTruthy();
			expect(r.values.name).toHaveLength(61);
		}
	});
});

describe('habitat translations', () => {
	it('uses the given language for the error messages', () => {
		const hu = parseHabitatForm(form({ name: ' ', kind: 'pond', notes: '' }));
		const en = parseHabitatForm(form({ name: ' ', kind: 'pond', notes: '' }), getT('en'));
		expect(!hu.ok && hu.errors.name).toBe(getT('hu')('pet.error.nameRequired'));
		expect(!en.ok && en.errors.name).toBe('Name is required.');
	});

	it('translates a kind label and keeps an unknown kind as it is', () => {
		expect(kindLabel('pond', getT('en'))).toBe('Pond');
		expect(kindLabel('castle', getT('en'))).toBe('castle');
	});
});
