export type EmailContent = { subject: string; text: string; html: string };

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

/** A jelszó-visszaállító levél tartalma (szöveges és HTML változat). */
export function resetPasswordEmail(name: string, url: string): EmailContent {
	const cleanName = name.trim();
	const greeting = cleanName ? `Szia ${cleanName}!` : 'Szia!';
	const safeGreeting = escapeHtml(greeting);
	const safeUrl = escapeHtml(url);

	const text = [
		greeting,
		'',
		'Jelszó-visszaállítást kértek a Pet Weight Tracker fiókodhoz.',
		'Az új jelszó megadásához nyisd meg ezt a linket (1 óráig érvényes):',
		'',
		url,
		'',
		'Ha nem te kérted, hagyd figyelmen kívül ezt a levelet, a jelszavad nem változik.'
	].join('\n');

	const html = `<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Jelszó-visszaállítás</title>
</head>
<body style="margin:0;padding:0;background-color:#eef3f2;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Állítsd be az új jelszavadat. A link 1 óráig érvényes.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef3f2;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<tr><td style="background-color:#0f766e;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:600;">🐾 Pet Weight Tracker</td></tr>
<tr><td style="padding:28px;color:#1f2933;font-size:16px;line-height:1.55;">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#111827;">Jelszó-visszaállítás</h1>
<p style="margin:0 0 12px;">${safeGreeting}</p>
<p style="margin:0 0 4px;">Jelszó-visszaállítást kértek a fiókodhoz. Az új jelszó megadásához kattints a gombra:</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td bgcolor="#0f766e" style="border-radius:8px;"><a href="${safeUrl}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">Új jelszó beállítása</a></td></tr></table>
<p style="margin:0 0 16px;font-size:14px;color:#52606d;">A link <strong>1 óráig</strong> érvényes.</p>
<p style="margin:0 0 4px;font-size:13px;color:#52606d;">Ha a gomb nem működik, másold be ezt a címet a böngészőbe:</p>
<p style="margin:0 0 24px;font-size:13px;word-break:break-all;"><a href="${safeUrl}" style="color:#0f766e;">${safeUrl}</a></p>
<hr style="border:none;border-top:1px solid #e4e9e8;margin:0 0 16px;" />
<p style="margin:0;font-size:13px;color:#52606d;">Ha nem te kérted a visszaállítást, hagyd figyelmen kívül ezt a levelet, a jelszavad nem változik.</p>
</td></tr>
</table>
<p style="max-width:520px;margin:16px 0 0;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#7b8794;">Ez egy automatikus levél a Pet Weight Tracker alkalmazásból.</p>
</td></tr>
</table>
</body>
</html>`;

	return { subject: 'Jelszó-visszaállítás – Pet Weight Tracker', text, html };
}
