import { describe, it, expect } from 'vitest';
import { resetPasswordEmail } from './mail-templates.ts';

describe('resetPasswordEmail languages', () => {
	it('writes English when the locale is en', () => {
		const mail = resetPasswordEmail('Anna', 'https://example.com/r', 'en');
		expect(mail.text.startsWith('Hi Anna!')).toBe(true);
		expect(mail.subject).toContain('Password reset');
		expect(mail.html).toContain('<html lang="en">');
	});

	it('greets without a name in English too', () => {
		const mail = resetPasswordEmail('   ', 'https://example.com/r', 'en');
		expect(mail.text.startsWith('Hi!')).toBe(true);
	});

	it('stays Hungarian by default', () => {
		const mail = resetPasswordEmail('Anna', 'https://example.com/r');
		expect(mail.html).toContain('<html lang="hu">');
		expect(mail.text.startsWith('Szia Anna!')).toBe(true);
	});
});
