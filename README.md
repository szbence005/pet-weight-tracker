# Pet Weight Tracker

A small web app for tracking the weight of your pets over time, keeping their photos, and recording which pets live together. The interface is available in **Hungarian and English**.

Originally built for tracking the growth of pet turtles, but it works for any pet (dog, cat, rabbit, hamster, bird, fish, ...).

## Features

- **Accounts:** sign up, log in, log out, password reset by email.
- **Pets:** name, species, breed, date of birth, notes. The age is shown on the pet card. Turtles get a searchable species list (common name and Latin name).
- **Weights:** add, edit and delete measurements, shown as a table and a chart (grams or kilograms).
- **Forecast:** a straight line fitted to the most recent measurements, with an optimistic and a pessimistic band, for a 3 month, 6 month or 1 year horizon. This is an indicative estimate, not a veterinary model: growth slows down with age.
- **Photos:** upload from the file picker or directly from the phone camera, set an avatar, delete. Images are resized in the browser and uploaded straight to ImageKit as private files.
- **Habitats ("Együttélés"):** record which pets live together in an aquarium, terrarium, pond, garden or enclosure. A pet can belong to several habitats.
- **Language switch (HU / EN):** the choice is saved in a cookie and, for logged-in users, in the profile. Emails follow the recipient's language.

## Tech stack

| Area           | Choice                                  |
| -------------- | --------------------------------------- |
| Framework      | SvelteKit with Svelte 5, TypeScript     |
| Styling        | Pico CSS plus a small custom stylesheet |
| Authentication | better-auth (email and password)        |
| Database       | PostgreSQL (Neon) with Drizzle ORM      |
| Image storage  | ImageKit (private files, signed URLs)   |
| Email          | nodemailer over SMTP                    |
| Hosting        | Vercel                                  |
| Tests          | Vitest                                  |
| Code quality   | Prettier, ESLint, `svelte-check`        |

## Project layout

```
src/
  lib/
    components/        Svelte components (PhotoGallery, BreedInput, Icon, ...)
    i18n/              Dictionaries (hu.ts, en.ts), getT, locale handling
    server/            Server-only code: database access, auth, mail, photos, habitats
      db/schema.ts     Drizzle schema
    pet-form.ts        Pure validation of the pet form
    weight-form.ts     Pure validation of the weight form
    habitat-form.ts    Pure validation of the habitat form
    forecast.ts        Weight forecast (pure functions)
    units.ts           Weight formatting
  routes/
    pets/              Pet list, pet page (weights, photos, edit)
    habitats/          Habitat list and habitat page
    locale/            Language switch endpoint
    login, signup, forgot-password, reset-password
```

Imports use the `#lib/...` alias for `src/lib`.

## Getting started

Requirements: Node.js, npm, a PostgreSQL database (a free Neon project is enough), an ImageKit account and an SMTP account.

```sh
npm install
```

Create a `.env` file in the project root (it must never be committed). The variables the code reads:

| Variable                                               | Purpose                                                                                        |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                         | PostgreSQL connection string. Use a **development** database locally.                          |
| `ORIGIN`                                               | Public URL of the app, for example `http://localhost:5173`                                     |
| `BETTER_AUTH_SECRET`                                   | Long random secret for better-auth                                                             |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | SMTP server (port 587 with STARTTLS)                                                           |
| `MAIL_FROM`                                            | Sender address of the emails                                                                   |
| ImageKit keys                                          | Public key, private key and URL endpoint; see `src/lib/server/imagekit.ts` for the exact names |

Create the tables and start the dev server:

```sh
npm run db:push
npm run dev
```

## Scripts

| Command                      | What it does                                              |
| ---------------------------- | --------------------------------------------------------- |
| `npm run dev`                | Start the development server                              |
| `npm run build`              | Production build                                          |
| `npm run format`             | Format the code with Prettier                             |
| `npm run check`              | Type and Svelte checks                                    |
| `npm run lint`               | Prettier check and ESLint                                 |
| `npm run test:unit -- --run` | Run the unit tests once                                   |
| `npm run db:push`            | Push the Drizzle schema to the database in `DATABASE_URL` |

Some tests use the database configured in `DATABASE_URL`. Run them only against a development database, never against production.

## Data model

- `user`, `session`, `account`, `verification`: managed by better-auth.
- `pets`: belong to one user.
- `weights`: measurements of a pet, stored in whole grams.
- `photos`: ImageKit file references of a pet, one can be the avatar.
- `habitats`: belong to one user.
- `habitat_pets`: join table (habitat, pet) with a composite primary key, so a pet can live in several habitats.
- `user_settings`: one row per user with the saved UI language.

Stored values stay language-neutral or Hungarian (for example the species `teknős`); the interface translates them for display.

## Security notes

- Every query that touches user data takes the user id from the session and filters by it. A pet, weight, photo or habitat of another user is answered with **404**, not 403, so its existence is not revealed.
- When a habitat and a pet are linked, both must belong to the logged-in user.
- Photos are private in ImageKit; the page receives short-lived signed URLs, created only after the ownership check.
- The language switch validates the value against an allow-list and accepts only local redirect paths.
- Secrets live in environment variables only. Never commit `.env`.

## Internationalisation

- Dictionaries: `src/lib/i18n/hu.ts` is the source of keys, `en.ts` must have the same keys (enforced by its type). Placeholders look like `{name}`.
- In components: `const t = useT();` then `t('some.key')`.
- On the server: `getT(locals.locale)`, for example in form actions, error messages and emails.
- The language is resolved in this order: saved user setting, `locale` cookie, browser language, Hungarian.
- Validation functions take the translate function as a parameter and return ready-made messages.

## Deployment

The app is deployed on Vercel from the Git repository. When the schema changes, push it to the production database **before** deploying code that uses the new tables. Do not run `drizzle-kit push` against production with the connection string stored in a file; pass it through an environment variable for the one command and clear it afterwards.

## Known limitations

- The forecast is a linear estimate and gets less accurate for longer horizons.
- Camera capture opens the camera only on mobile browsers over HTTPS.
- The Hungarian turtle species names are not verified by an expert.
- Habitats have no history yet (a pet that moves between habitats is simply in several).
- Browser end-to-end tests (Playwright) are not written yet.

## License

MIT, see the [LICENSE](LICENSE) file.
