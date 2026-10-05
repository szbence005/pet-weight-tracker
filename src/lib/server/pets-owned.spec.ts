import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { inArray } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { user } from '#lib/server/db/schema.ts';
import { createPet, deleteOwnedPet, getOwnedPet, updateOwnedPet } from './pets.ts';

const userAId = `test-a-${crypto.randomUUID()}`;
const userBId = `test-b-${crypto.randomUUID()}`;

let updatePetId = '';
let deletePetId = '';

const input = (name: string) => ({
	name,
	species: 'kutya',
	breed: null,
	birthDate: null,
	notes: null
});

beforeAll(async () => {
	await db.insert(user).values([
		{ id: userAId, name: 'Test A', email: `${userAId}@example.test` },
		{ id: userBId, name: 'Test B', email: `${userBId}@example.test` }
	]);

	const forUpdate = await createPet(userAId, input('Rex'));
	const forDelete = await createPet(userAId, input('Bodri'));
	if (!forUpdate || !forDelete) throw new Error('test setup failed');
	updatePetId = forUpdate.id;
	deletePetId = forDelete.id;
});

afterAll(async () => {
	// Deleting the users also deletes their pets (ON DELETE CASCADE).
	await db.delete(user).where(inArray(user.id, [userAId, userBId]));
});

describe('updateOwnedPet', () => {
	it('lets another user NOT update the pet, and leaves it unchanged', async () => {
		const result = await updateOwnedPet(userBId, updatePetId, input('Hacked'));
		expect(result).toBeUndefined();

		const pet = await getOwnedPet(userAId, updatePetId);
		expect(pet?.name).toBe('Rex');
	});

	it('returns undefined for a malformed id', async () => {
		expect(await updateOwnedPet(userAId, 'not-a-uuid', input('X'))).toBeUndefined();
	});

	it('lets the owner update the pet', async () => {
		const result = await updateOwnedPet(userAId, updatePetId, input('Rexi'));
		expect(result?.name).toBe('Rexi');
	});
});

describe('deleteOwnedPet', () => {
	it('does NOT delete the pet of another user', async () => {
		expect(await deleteOwnedPet(userBId, deletePetId)).toBe(false);
		expect(await getOwnedPet(userAId, deletePetId)).toBeDefined();
	});

	it('returns false for a malformed id', async () => {
		expect(await deleteOwnedPet(userAId, 'not-a-uuid')).toBe(false);
	});

	it('lets the owner delete the pet', async () => {
		expect(await deleteOwnedPet(userAId, deletePetId)).toBe(true);
		expect(await getOwnedPet(userAId, deletePetId)).toBeUndefined();
	});
});
