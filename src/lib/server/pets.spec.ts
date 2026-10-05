import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { inArray } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { pets, user } from '#lib/server/db/schema.ts';
import { getOwnedPet } from './pets.ts';

const userAId = `test-a-${crypto.randomUUID()}`;
const userBId = `test-b-${crypto.randomUUID()}`;
let petOfAId: string;

beforeAll(async () => {
	await db.insert(user).values([
		{ id: userAId, name: 'Test A', email: `${userAId}@example.test` },
		{ id: userBId, name: 'Test B', email: `${userBId}@example.test` }
	]);
	const [pet] = await db
		.insert(pets)
		.values({ ownerId: userAId, name: 'Rex', species: 'dog' })
		.returning({ id: pets.id });
	petOfAId = pet.id;
});

afterAll(async () => {
	// Deleting the users also deletes their pets (ON DELETE CASCADE).
	await db.delete(user).where(inArray(user.id, [userAId, userBId]));
});

describe('getOwnedPet', () => {
	it('returns the pet to its owner', async () => {
		const pet = await getOwnedPet(userAId, petOfAId);
		expect(pet?.name).toBe('Rex');
	});

	it("does not return another user's pet", async () => {
		const pet = await getOwnedPet(userBId, petOfAId);
		expect(pet).toBeUndefined();
	});

	it('returns undefined for an id that does not exist', async () => {
		const pet = await getOwnedPet(userAId, crypto.randomUUID());
		expect(pet).toBeUndefined();
	});

	it('returns undefined for a malformed id instead of throwing', async () => {
		const pet = await getOwnedPet(userAId, 'not-a-uuid');
		expect(pet).toBeUndefined();
	});
});
