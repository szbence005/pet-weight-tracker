import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { habitatPets, habitats, pets } from '#lib/server/db/schema.ts';
import { getOwnedPet } from '#lib/server/pets.ts';
import type { HabitatInput } from '#lib/habitat-form.ts';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The only way to load a single habitat. Returns it only if it belongs to the user.
// Never query habitats by id alone.
export async function getOwnedHabitat(userId: string, habitatId: string) {
	// A malformed id would make Postgres throw (500), so reject it here.
	if (!UUID_RE.test(habitatId)) return undefined;

	const [habitat] = await db
		.select()
		.from(habitats)
		.where(and(eq(habitats.id, habitatId), eq(habitats.ownerId, userId)))
		.limit(1);

	return habitat;
}

// All habitats of one user (newest first), each with the pets that live there.
export async function listHabitats(userId: string) {
	const rows = await db
		.select()
		.from(habitats)
		.where(eq(habitats.ownerId, userId))
		.orderBy(desc(habitats.createdAt));
	if (rows.length === 0) return [];

	// The pets are filtered by owner as well, as a second guard.
	const members = await db
		.select({
			habitatId: habitatPets.habitatId,
			id: pets.id,
			name: pets.name,
			species: pets.species
		})
		.from(habitatPets)
		.innerJoin(pets, eq(habitatPets.petId, pets.id))
		.where(
			and(
				inArray(
					habitatPets.habitatId,
					rows.map((h) => h.id)
				),
				eq(pets.ownerId, userId)
			)
		)
		.orderBy(pets.name);

	return rows.map((habitat) => ({
		...habitat,
		pets: members
			.filter((m) => m.habitatId === habitat.id)
			.map(({ id, name, species }) => ({ id, name, species }))
	}));
}

// The owner always comes from the logged-in user, never from the form.
export async function createHabitat(userId: string, input: HabitatInput) {
	const [habitat] = await db
		.insert(habitats)
		.values({ ownerId: userId, ...input })
		.returning();
	return habitat;
}

export async function updateOwnedHabitat(userId: string, habitatId: string, input: HabitatInput) {
	if (!UUID_RE.test(habitatId)) return undefined;

	const [habitat] = await db
		.update(habitats)
		.set(input)
		.where(and(eq(habitats.id, habitatId), eq(habitats.ownerId, userId)))
		.returning();

	return habitat;
}

// Deleting a habitat removes the memberships (cascade), never the pets.
export async function deleteOwnedHabitat(userId: string, habitatId: string): Promise<boolean> {
	if (!UUID_RE.test(habitatId)) return false;

	const deleted = await db
		.delete(habitats)
		.where(and(eq(habitats.id, habitatId), eq(habitats.ownerId, userId)))
		.returning({ id: habitats.id });

	return deleted.length > 0;
}

// Puts a pet into a habitat. BOTH must belong to the user, otherwise nothing happens and
// false is returned. Adding the same pet twice is fine (one row).
export async function addPetToHabitat(
	userId: string,
	habitatId: string,
	petId: string
): Promise<boolean> {
	const habitat = await getOwnedHabitat(userId, habitatId);
	const pet = await getOwnedPet(userId, petId);
	if (!habitat || !pet) return false;

	await db
		.insert(habitatPets)
		.values({ habitatId: habitat.id, petId: pet.id })
		.onConflictDoNothing();
	return true;
}

// Takes a pet out of a habitat. The habitat must belong to the user.
export async function removePetFromHabitat(
	userId: string,
	habitatId: string,
	petId: string
): Promise<boolean> {
	const habitat = await getOwnedHabitat(userId, habitatId);
	if (!habitat || !UUID_RE.test(petId)) return false;

	const removed = await db
		.delete(habitatPets)
		.where(and(eq(habitatPets.habitatId, habitat.id), eq(habitatPets.petId, petId)))
		.returning({ petId: habitatPets.petId });

	return removed.length > 0;
}
