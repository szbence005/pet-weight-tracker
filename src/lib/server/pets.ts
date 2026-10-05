import { and, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { pets } from '#lib/server/db/schema.ts';

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
