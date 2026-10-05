import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { inArray } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { user } from '#lib/server/db/schema.ts';
import { createPet, listPets } from './pets.ts';

const userAId = `test-a-${crypto.randomUUID()}`;
const userBId = `test-b-${crypto.randomUUID()}`;

beforeAll(async () => {
	await db.insert(user).values([
		{ id: userAId, name: 'Test A', email: `${userAId}@example.test` },
		{ id: userBId, name: 'Test B', email: `${userBId}@example.test` }
	]);
	await createPet(userAId, {
		name: 'Mici',
		species: 'macska',
		breed: null,
		birthDate: '2020-05-01',
		notes: null
	});
});

afterAll(async () => {
	// Deleting the users also deletes their pets (ON DELETE CASCADE).
	await db.delete(user).where(inArray(user.id, [userAId, userBId]));
});

describe('createPet and listPets', () => {
	it('lists a created pet for its owner', async () => {
		const list = await listPets(userAId);
		expect(list.map((pet) => pet.name)).toEqual(['Mici']);
	});

	it("does not list another user's pets", async () => {
		const list = await listPets(userBId);
		expect(list).toEqual([]);
	});
});
