import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { inArray } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { user } from '#lib/server/db/schema.ts';
import { createPet, deleteOwnedPet, getOwnedPet, updateOwnedPet } from './pets.ts';

const userAId = `test-a-${crypto.randomUUID()}`;
const userBId = `test-b-${crypto.randomUUID()}`;

const sample = {
	name: 'Mici',
	species: 'macska',
	breed: null,
	birthDate: null,
	notes: null
} as const;

async function makePet(ownerId: string, name: string) {
	const pet = await createPet(ownerId, { ...sample, name });
	if (!pet) throw new Error('A teszt kedvenc létrehozása nem sikerült');
	return pet.id;
}

beforeAll(async () => {
	await db.insert(user).values([
		{ id: userAId, name: 'Test A', email: `${userAId}@example.test` },
		{ id: userBId, name: 'Test B', email: `${userBId}@example.test` }
	]);
});

afterAll(async () => {
	// Deleting the users also deletes their pets (ON DELETE CASCADE).
	await db.delete(user).where(inArray(user.id, [userAId, userBId]));
});

describe('updateOwnedPet', () => {
	it('updates the pet for its owner', async () => {
		const id = await makePet(userAId, 'Egyik');
		const updated = await updateOwnedPet(userAId, id, {
			...sample,
			name: 'Új név',
			notes: 'jegyzet'
		});
		expect(updated?.name).toBe('Új név');
		const reloaded = await getOwnedPet(userAId, id);
		expect(reloaded?.notes).toBe('jegyzet');
	});

	it("does not update another user's pet", async () => {
		const id = await makePet(userAId, 'Védett');
		const result = await updateOwnedPet(userBId, id, { ...sample, name: 'Elvett' });
		expect(result).toBeUndefined();
		const reloaded = await getOwnedPet(userAId, id);
		expect(reloaded?.name).toBe('Védett');
	});

	it('rejects a malformed id', async () => {
		expect(await updateOwnedPet(userAId, 'nem-uuid', sample)).toBeUndefined();
	});
});

describe('deleteOwnedPet', () => {
	it('deletes the pet for its owner', async () => {
		const id = await makePet(userAId, 'Törlendő');
		expect(await deleteOwnedPet(userAId, id)).toBe(true);
		expect(await getOwnedPet(userAId, id)).toBeUndefined();
	});

	it("does not delete another user's pet", async () => {
		const id = await makePet(userAId, 'Megmarad');
		expect(await deleteOwnedPet(userBId, id)).toBe(false);
		const reloaded = await getOwnedPet(userAId, id);
		expect(reloaded?.name).toBe('Megmarad');
	});

	it('rejects a malformed id', async () => {
		expect(await deleteOwnedPet(userAId, 'nem-uuid')).toBe(false);
	});
});
