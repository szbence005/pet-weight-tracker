import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { inArray } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { user } from '#lib/server/db/schema.ts';
import { createPet, deleteOwnedPet, listPets } from './pets.ts';
import {
	addPetToHabitat,
	createHabitat,
	deleteOwnedHabitat,
	getOwnedHabitat,
	listHabitats,
	removePetFromHabitat,
	updateOwnedHabitat
} from './habitats.ts';

const userAId = `test-a-${crypto.randomUUID()}`;
const userBId = `test-b-${crypto.randomUUID()}`;

async function mkPet(owner: string, name: string) {
	const pet = await createPet(owner, {
		name,
		species: 'macska',
		breed: null,
		birthDate: null,
		notes: null
	});
	if (!pet) throw new Error('pet not created');
	return pet;
}

async function mkHabitat(owner: string, name: string) {
	const habitat = await createHabitat(owner, { name, kind: 'aquarium', notes: null });
	if (!habitat) throw new Error('habitat not created');
	return habitat;
}

let petA1: Awaited<ReturnType<typeof mkPet>>;
let petA2: Awaited<ReturnType<typeof mkPet>>;
let petB: Awaited<ReturnType<typeof mkPet>>;

beforeAll(async () => {
	await db.insert(user).values([
		{ id: userAId, name: 'Test A', email: `${userAId}@example.test` },
		{ id: userBId, name: 'Test B', email: `${userBId}@example.test` }
	]);
	petA1 = await mkPet(userAId, 'Mici');
	petA2 = await mkPet(userAId, 'Kormi');
	petB = await mkPet(userBId, 'Idegen');
});

afterAll(async () => {
	// Deleting the users also deletes their pets and habitats (ON DELETE CASCADE).
	await db.delete(user).where(inArray(user.id, [userAId, userBId]));
});

describe('habitats: create, list, update', () => {
	it('lists a habitat only for its owner', async () => {
		const h = await mkHabitat(userAId, 'Lista');
		expect((await listHabitats(userAId)).map((x) => x.id)).toContain(h.id);
		expect((await listHabitats(userBId)).map((x) => x.id)).not.toContain(h.id);
	});

	it('lets the owner update, and nobody else', async () => {
		const h = await mkHabitat(userAId, 'Frissites');
		const input = { name: 'Uj nev', kind: 'pond' as const, notes: 'x' };
		expect(await updateOwnedHabitat(userBId, h.id, input)).toBeUndefined();
		expect((await updateOwnedHabitat(userAId, h.id, input))?.name).toBe('Uj nev');
	});

	it('does not reveal a habitat to another user and handles malformed ids', async () => {
		const h = await mkHabitat(userAId, 'Titkos');
		expect(await getOwnedHabitat(userBId, h.id)).toBeUndefined();
		expect(await getOwnedHabitat(userAId, 'not-a-uuid')).toBeUndefined();
		expect(await deleteOwnedHabitat(userAId, 'not-a-uuid')).toBe(false);
	});
});

describe('habitats: who lives together', () => {
	it('shows the pets of a habitat, and the same pet twice gives one row', async () => {
		const h = await mkHabitat(userAId, 'Egyutt');
		expect(await addPetToHabitat(userAId, h.id, petA1.id)).toBe(true);
		expect(await addPetToHabitat(userAId, h.id, petA2.id)).toBe(true);
		expect(await addPetToHabitat(userAId, h.id, petA1.id)).toBe(true);

		const listed = (await listHabitats(userAId)).find((x) => x.id === h.id);
		expect(listed?.pets.map((p) => p.name)).toEqual(['Kormi', 'Mici']);
	});

	it('lets one pet live in several habitats', async () => {
		const h1 = await mkHabitat(userAId, 'Nyari to');
		const h2 = await mkHabitat(userAId, 'Teli akvarium');
		await addPetToHabitat(userAId, h1.id, petA1.id);
		await addPetToHabitat(userAId, h2.id, petA1.id);
		const all = await listHabitats(userAId);
		expect(all.find((x) => x.id === h1.id)?.pets).toHaveLength(1);
		expect(all.find((x) => x.id === h2.id)?.pets).toHaveLength(1);
	});

	it("cannot put somebody else's pet into your habitat", async () => {
		const h = await mkHabitat(userAId, 'Csak az enyem');
		expect(await addPetToHabitat(userAId, h.id, petB.id)).toBe(false);
		const listed = (await listHabitats(userAId)).find((x) => x.id === h.id);
		expect(listed?.pets).toEqual([]);
	});

	it("cannot put your pet into somebody else's habitat", async () => {
		const hB = await mkHabitat(userBId, 'B akvarium');
		expect(await addPetToHabitat(userAId, hB.id, petA1.id)).toBe(false);
		expect(await addPetToHabitat(userAId, hB.id, petB.id)).toBe(false);
		const listed = (await listHabitats(userBId)).find((x) => x.id === hB.id);
		expect(listed?.pets).toEqual([]);
	});

	it('removes a pet from a habitat, but only for the owner', async () => {
		const h = await mkHabitat(userAId, 'Kiveves');
		await addPetToHabitat(userAId, h.id, petA1.id);
		expect(await removePetFromHabitat(userBId, h.id, petA1.id)).toBe(false);
		expect(await removePetFromHabitat(userAId, h.id, petA1.id)).toBe(true);
		expect(await removePetFromHabitat(userAId, h.id, petA1.id)).toBe(false);
	});

	it('keeps the pets when a habitat is deleted, and vice versa', async () => {
		const h = await mkHabitat(userAId, 'Torlendo');
		const extra = await mkPet(userAId, 'Torlendo allat');
		await addPetToHabitat(userAId, h.id, petA1.id);
		await addPetToHabitat(userAId, h.id, extra.id);

		// Deleting a pet only removes it from the habitat.
		expect(await deleteOwnedPet(userAId, extra.id)).toBe(true);
		const afterPet = (await listHabitats(userAId)).find((x) => x.id === h.id);
		expect(afterPet?.pets.map((p) => p.id)).toEqual([petA1.id]);

		// Deleting the habitat leaves the pets alone; another user cannot delete it.
		expect(await deleteOwnedHabitat(userBId, h.id)).toBe(false);
		expect(await deleteOwnedHabitat(userAId, h.id)).toBe(true);
		expect((await listPets(userAId)).map((p) => p.id)).toContain(petA1.id);
	});
});
