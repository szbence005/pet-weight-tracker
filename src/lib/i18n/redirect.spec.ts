import { describe, it, expect } from 'vitest';
import { safeRedirectPath } from './redirect.ts';

describe('safeRedirectPath', () => {
	it('keeps normal paths, including query strings', () => {
		expect(safeRedirectPath('/pets')).toBe('/pets');
		expect(safeRedirectPath('/pets?tab=photos')).toBe('/pets?tab=photos');
	});

	it('rejects absolute and protocol-relative URLs', () => {
		expect(safeRedirectPath('https://evil.example')).toBe('/');
		expect(safeRedirectPath('//evil.example')).toBe('/');
		expect(safeRedirectPath('evil')).toBe('/');
	});

	it('rejects backslash tricks and line breaks', () => {
		expect(safeRedirectPath('/\\evil.example')).toBe('/');
		expect(safeRedirectPath('/ok\r\nSet-Cookie: x=1')).toBe('/');
	});

	it('falls back for missing or non-string values', () => {
		expect(safeRedirectPath(null)).toBe('/');
		expect(safeRedirectPath(undefined)).toBe('/');
		expect(safeRedirectPath(42, '/pets')).toBe('/pets');
	});
});
