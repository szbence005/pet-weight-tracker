import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_FROM } from '$app/env/private';

export type MailOptions = { to: string; subject: string; text: string; html?: string };

/** Levél küldése SMTP-n (Brevo). Ha van html, a szöveges rész tartalék marad. A hibát továbbdobja. */
export async function sendMail({ to, subject, text, html }: MailOptions): Promise<void> {
	const transport = nodemailer.createTransport({
		host: SMTP_HOST,
		port: Number(SMTP_PORT),
		secure: false, // 587-es porton STARTTLS-t használ
		auth: { user: SMTP_USER, pass: SMTP_PASSWORD }
	});
	await transport.sendMail({ from: MAIL_FROM, to, subject, text, html });
}
