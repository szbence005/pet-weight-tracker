import { and, desc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { pets } from '#lib/server/db/schema.ts';
import type { PetInput } from '#lib/pet-form.ts';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The only way to load a single pet. Returns the pet only if it belongs to
// the given user; otherwise undefined. Never query pets by id alone.
export async function getOwnedPet(userId: string, petId: string) {
	// A malformed id would make Postgres throw (500), so reject it here.
	if (!UUID_RE.test(petId)) return undefined;

	const [pet] = await db
		.select()
		.from(pets)
		.where(and(eq(pets.id, petId), eq(pets.ownerId, userId)))
		.limit(1);

	return pet;
}

// All pets of one user, newest first.
export async function listPets(userId: string) {
	return db.select().from(pets).where(eq(pets.ownerId, userId)).orderBy(desc(pets.createdAt));
}

// The owner always comes from the logged-in user, never from the form.
export async function createPet(userId: string, input: PetInput) {
	const [pet] = await db
		.insert(pets)
		.values({ ownerId: userId, ...input })
		.returning();
	return pet;
}

// Updates a pet only if it belongs to the user. Returns the updated pet,
// or undefined when it does not exist or is somebody else's.
export async function updateOwnedPet(userId: string, petId: string, input: PetInput) {
	if (!UUID_RE.test(petId)) return undefined;

	const [pet] = await db
		.update(pets)
		.set(input)
		.where(and(eq(pets.id, petId), eq(pets.ownerId, userId)))
		.returning();

	return pet;
}

// Deletes a pet only if it belongs to the user. Returns true if a row was deleted.
export async function deleteOwnedPet(userId: string, petId: string): Promise<boolean> {
	if (!UUID_RE.test(petId)) return false;

	const deleted = await db
		.delete(pets)
		.where(and(eq(pets.id, petId), eq(pets.ownerId, userId)))
		.returning({ id: pets.id });

	return deleted.length > 0;
}
