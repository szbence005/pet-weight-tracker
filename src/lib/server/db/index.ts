import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { DATABASE_URL } from '$app/env/private';

if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');

// Neon pooled connections (PgBouncer) do not support prepared statements,
// so turn them off when the host name contains "-pooler".
const client = postgres(DATABASE_URL, { prepare: !DATABASE_URL.includes('-pooler') });

export const db = drizzle(client, { schema });
