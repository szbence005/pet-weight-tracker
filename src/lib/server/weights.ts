import { and, asc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { weightEntries } from '#lib/server/db/schema.ts';
import { getOwnedPet } from './pets.ts';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type WeightInput = {
	weightGrams: number;
	measuredAt: string; // YYYY-MM-DD
	note: string | null;
};

// All functions below first check that the pet belongs to the user.
// They return undefined (or false) when it does not, and never touch
// weight_entries in that case.

// Entries of one pet, oldest first (the order the chart needs).
export async function listWeights(userId: string, petId: string) {
	const pet = await getOwnedPet(userId, petId);
	if (!pet) return undefined;

	return db
		.select()
		.from(weightEntries)
		.where(eq(weightEntries.petId, pet.id))
		.orderBy(asc(weightEntries.measuredAt));
}

export async function addWeight(userId: string, petId: string, input: WeightInput) {
	const pet = await getOwnedPet(userId, petId);
	if (!pet) return undefined;

	const [entry] = await db
		.insert(weightEntries)
		.values({ petId: pet.id, ...input })
		.returning();
	return entry;
}

export async function updateWeight(
	userId: string,
	petId: string,
	entryId: string,
	input: WeightInput
) {
	if (!UUID_RE.test(entryId)) return undefined;
	const pet = await getOwnedPet(userId, petId);
	if (!pet) return undefined;

	const [entry] = await db
		.update(weightEntries)
		.set(input)
		.where(and(eq(weightEntries.id, entryId), eq(weightEntries.petId, pet.id)))
		.returning();
	return entry;
}

export async function deleteWeight(
	userId: string,
	petId: string,
	entryId: string
): Promise<boolean> {
	if (!UUID_RE.test(entryId)) return false;
	const pet = await getOwnedPet(userId, petId);
	if (!pet) return false;

	const deleted = await db
		.delete(weightEntries)
		.where(and(eq(weightEntries.id, entryId), eq(weightEntries.petId, pet.id)))
		.returning({ id: weightEntries.id });
	return deleted.length > 0;
}
