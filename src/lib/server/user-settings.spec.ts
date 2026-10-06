import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { inArray } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { user } from '#lib/server/db/schema.ts';
import { getUserLocale, setUserLocale } from './user-settings.ts';

const userAId = `test-a-${crypto.randomUUID()}`;
const userBId = `test-b-${crypto.randomUUID()}`;

beforeAll(async () => {
	await db.insert(user).values([
		{ id: userAId, name: 'Test A', email: `${userAId}@example.test` },
		{ id: userBId, name: 'Test B', email: `${userBId}@example.test` }
	]);
});

afterAll(async () => {
	// Deleting the users also deletes their settings (ON DELETE CASCADE).
	await db.delete(user).where(inArray(user.id, [userAId, userBId]));
});

describe('user locale', () => {
	it('is null when nothing is saved', async () => {
		expect(await getUserLocale(userAId)).toBeNull();
		expect(await getUserLocale(`nobody-${crypto.randomUUID()}`)).toBeNull();
	});

	it('is saved and can be overwritten', async () => {
		expect(await setUserLocale(userAId, 'en')).toBe(true);
		expect(await getUserLocale(userAId)).toBe('en');
		expect(await setUserLocale(userAId, 'hu')).toBe(true);
		expect(await getUserLocale(userAId)).toBe('hu');
	});

	it("never changes another user's setting", async () => {
		await setUserLocale(userAId, 'en');
		expect(await getUserLocale(userBId)).toBeNull();
		await setUserLocale(userBId, 'hu');
		await setUserLocale(userAId, 'en');
		expect(await getUserLocale(userBId)).toBe('hu');
		expect(await getUserLocale(userAId)).toBe('en');
	});

	it('rejects an unsupported language and keeps the old value', async () => {
		await setUserLocale(userAId, 'en');
		expect(await setUserLocale(userAId, 'de')).toBe(false);
		expect(await setUserLocale(userAId, '')).toBe(false);
		expect(await getUserLocale(userAId)).toBe('en');
	});
});
