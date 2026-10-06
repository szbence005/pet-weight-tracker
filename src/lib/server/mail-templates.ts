import { getT } from '../i18n/index.ts';
import { defaultLocale, type Locale } from '../i18n/locale.ts';

export type EmailContent = { subject: string; text: string; html: string };

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

/** The password reset email (text and HTML version) in the given language. */
export function resetPasswordEmail(
	name: string,
	url: string,
	locale: Locale = defaultLocale
): EmailContent {
	const t = getT(locale);
	const cleanName = name.trim();
	const greeting = cleanName
		? t('mail.reset.greeting', { name: cleanName })
		: t('mail.reset.greetingAnon');
	const safeGreeting = escapeHtml(greeting);
	const safeUrl = escapeHtml(url);

	const text = [
		greeting,
		'',
		t('mail.reset.textIntro'),
		t('mail.reset.textLink'),
		'',
		url,
		'',
		t('mail.reset.ignore')
	].join('\n');

	const html = `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${t('mail.reset.title')}</title>
</head>
<body style="margin:0;padding:0;background-color:#eef3f2;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${t('mail.reset.preheader')}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef3f2;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<tr><td style="background-color:#0f766e;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:600;">\u{1F43E} Pet Weight Tracker</td></tr>
<tr><td style="padding:28px;color:#1f2933;font-size:16px;line-height:1.55;">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#111827;">${t('mail.reset.title')}</h1>
<p style="margin:0 0 12px;">${safeGreeting}</p>
<p style="margin:0 0 4px;">${t('mail.reset.htmlIntro')}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td bgcolor="#0f766e" style="border-radius:8px;"><a href="${safeUrl}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${t('mail.reset.button')}</a></td></tr></table>
<p style="margin:0 0 16px;font-size:14px;color:#52606d;">${t('mail.reset.validHtml')}</p>
<p style="margin:0 0 4px;font-size:13px;color:#52606d;">${t('mail.reset.fallback')}</p>
<p style="margin:0 0 24px;font-size:13px;word-break:break-all;"><a href="${safeUrl}" style="color:#0f766e;">${safeUrl}</a></p>
<hr style="border:none;border-top:1px solid #e4e9e8;margin:0 0 16px;" />
<p style="margin:0;font-size:13px;color:#52606d;">${t('mail.reset.ignore')}</p>
</td></tr>
</table>
<p style="max-width:520px;margin:16px 0 0;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#7b8794;">${t('mail.reset.footer')}</p>
</td></tr>
</table>
</body>
</html>`;

	return { subject: t('mail.reset.subject'), text, html };
}
