import { describe, it, expect } from 'vitest';
import { resetPasswordEmail } from './mail-templates.ts';

describe('resetPasswordEmail', () => {
	it('a szöveges változatban nyers, a HTML-ben escape-elt a link', () => {
		const url = 'https://example.com/reset?token=a&b=1';
		const mail = resetPasswordEmail('Anna', url);
		expect(mail.text).toContain(url);
		expect(mail.html).toContain('token=a&amp;b=1');
		expect(mail.html).not.toContain('token=a&b=1');
	});

	it('a nevet escape-eli, nem engedi át a HTML-t', () => {
		const mail = resetPasswordEmail('<script>alert(1)</script>', 'https://example.com/r');
		expect(mail.html).not.toContain('<script>');
		expect(mail.html).toContain('&lt;script&gt;');
	});

	it('név nélkül is köszön', () => {
		const mail = resetPasswordEmail('   ', 'https://example.com/r');
		expect(mail.text.startsWith('Szia!')).toBe(true);
	});
});
