import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { inArray } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { user } from '#lib/server/db/schema.ts';
import { createPet } from './pets.ts';
import { addWeight, deleteWeight, listWeights, updateWeight } from './weights.ts';

const userAId = `test-a-${crypto.randomUUID()}`;
const userBId = `test-b-${crypto.randomUUID()}`;

const weight = (grams: number, date: string) => ({
	weightGrams: grams,
	measuredAt: date,
	note: null
});

// Every test gets its own fresh pets, so tests do not affect each other.
async function newPet(ownerId: string) {
	const pet = await createPet(ownerId, {
		name: 'Teszt',
		species: 'kutya',
		breed: null,
		birthDate: null,
		notes: null
	});
	if (!pet) throw new Error('test setup failed');
	return pet.id;
}

beforeAll(async () => {
	await db.insert(user).values([
		{ id: userAId, name: 'Test A', email: `${userAId}@example.test` },
		{ id: userBId, name: 'Test B', email: `${userBId}@example.test` }
	]);
});

afterAll(async () => {
	// Deleting the users also deletes pets and weights (ON DELETE CASCADE).
	await db.delete(user).where(inArray(user.id, [userAId, userBId]));
});

describe('weights: owner', () => {
	it('lists entries oldest first', async () => {
		const petId = await newPet(userAId);
		await addWeight(userAId, petId, weight(4200, '2026-03-01'));
		await addWeight(userAId, petId, weight(4000, '2026-01-01'));

		const list = await listWeights(userAId, petId);
		expect(list?.map((e) => e.measuredAt)).toEqual(['2026-01-01', '2026-03-01']);
	});

	it('can update and delete an entry', async () => {
		const petId = await newPet(userAId);
		const entry = await addWeight(userAId, petId, weight(4000, '2026-01-01'));
		if (!entry) throw new Error('test setup failed');

		const updated = await updateWeight(userAId, petId, entry.id, weight(4100, '2026-01-02'));
		expect(updated?.weightGrams).toBe(4100);

		expect(await deleteWeight(userAId, petId, entry.id)).toBe(true);
		expect(await listWeights(userAId, petId)).toEqual([]);
	});

	it('rejects a malformed entry id', async () => {
		const petId = await newPet(userAId);
		expect(await updateWeight(userAId, petId, 'nope', weight(1, '2026-01-01'))).toBeUndefined();
		expect(await deleteWeight(userAId, petId, 'nope')).toBe(false);
	});
});

describe('weights: isolation', () => {
	it("another user cannot list or add to somebody else's pet", async () => {
		const petId = await newPet(userAId);

		expect(await listWeights(userBId, petId)).toBeUndefined();
		expect(await addWeight(userBId, petId, weight(9999, '2026-01-01'))).toBeUndefined();
		expect(await listWeights(userAId, petId)).toEqual([]);
	});

	it('another user cannot update or delete an entry', async () => {
		const petId = await newPet(userAId);
		const entry = await addWeight(userAId, petId, weight(4000, '2026-01-01'));
		if (!entry) throw new Error('test setup failed');

		expect(await updateWeight(userBId, petId, entry.id, weight(1, '2026-01-01'))).toBeUndefined();
		expect(await deleteWeight(userBId, petId, entry.id)).toBe(false);

		const list = await listWeights(userAId, petId);
		expect(list?.map((e) => e.weightGrams)).toEqual([4000]);
	});

	it('an entry is not reachable through another pet, even of the same owner', async () => {
		const petId = await newPet(userAId);
		const otherPetId = await newPet(userAId);
		const entry = await addWeight(userAId, petId, weight(4000, '2026-01-01'));
		if (!entry) throw new Error('test setup failed');

		expect(
			await updateWeight(userAId, otherPetId, entry.id, weight(1, '2026-01-01'))
		).toBeUndefined();
		expect(await deleteWeight(userAId, otherPetId, entry.id)).toBe(false);
		expect((await listWeights(userAId, petId))?.length).toBe(1);
	});
});
