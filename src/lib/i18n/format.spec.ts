import { describe, it, expect } from 'vitest';
import { formatDate } from './format.ts';

describe('formatDate', () => {
	it('writes English dates with the month name', () => {
		expect(formatDate('2020-05-15', 'en')).toBe('15 May 2020');
	});

	it('writes a different text in Hungarian and keeps the year', () => {
		const text = formatDate('2020-05-15', 'hu');
		expect(text).toContain('2020');
		expect(text).not.toBe(formatDate('2020-05-15', 'en'));
	});
});
