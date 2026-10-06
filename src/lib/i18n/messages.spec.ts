import { describe, it, expect } from 'vitest';
import { en } from './en.ts';
import { fillParams, getT } from './index.ts';
import { hu } from './hu.ts';

const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();

describe('dictionaries', () => {
	it('have exactly the same keys', () => {
		expect(Object.keys(en).sort()).toEqual(Object.keys(hu).sort());
	});

	it('have no empty strings', () => {
		for (const dictionary of [hu, en]) {
			for (const [key, value] of Object.entries(dictionary)) {
				expect(value.trim(), key).not.toBe('');
			}
		}
	});

	it('use the same placeholders in both languages', () => {
		const huMap: Record<string, string> = hu;
		for (const [key, value] of Object.entries(en)) {
			expect(placeholders(value), key).toEqual(placeholders(huMap[key]));
		}
	});
});

describe('translation', () => {
	it('fills placeholders and leaves unknown ones alone', () => {
		expect(fillParams('Hi {name}, {x}!', { name: 'Anna' })).toBe('Hi Anna, {x}!');
		expect(fillParams('Hi {name}', { name: 3 })).toBe('Hi 3');
		expect(fillParams('plain')).toBe('plain');
	});

	it('returns the text of the requested language', () => {
		expect(getT('en')('auth.login')).toBe('Log in');
		expect(getT('hu')('auth.login')).not.toBe(getT('en')('auth.login'));
	});
});
