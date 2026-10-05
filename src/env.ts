import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATABASE_URL: { description: 'The database connection string.' },
	ORIGIN: {
		description: 'The app origin (base URL), e.g. `http://localhost:5173`.'
	},
	BETTER_AUTH_SECRET: {
		description:
			'Secret used to sign tokens. For production use 32 characters generated with high entropy. See [Better Auth installation](https://www.better-auth.com/docs/installation).'
	},
	SMTP_HOST: { description: 'SMTP server host, e.g. `smtp-relay.brevo.com`.' },
	SMTP_PORT: { description: 'SMTP server port, e.g. `587` (STARTTLS).' },
	SMTP_USER: { description: 'SMTP login (Brevo: the SMTP login address).' },
	SMTP_PASSWORD: { description: 'SMTP key (secret). Not the Brevo API key.' },
	MAIL_FROM: { description: 'Sender address, must be a verified sender in Brevo.' }
});
