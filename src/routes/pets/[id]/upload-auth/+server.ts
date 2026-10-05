import { error, json } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth-guard.ts';
import { getOwnedPet } from '#lib/server/pets.ts';
import { photoFolder } from '#lib/server/photos.ts';
import { getUploadAuth } from '#lib/server/imagekit.ts';
import type { RequestHandler } from './$types';

// The browser calls this right before each upload. Only the owner of the pet
// gets parameters, and the folder is fixed to this pet.
export const POST: RequestHandler = async ({ locals, params }) => {
	const user = requireUser(locals);
	const pet = await getOwnedPet(user.id, params.id);
	// 404 (not 403): do not reveal that the pet exists for somebody else.
	if (!pet) error(404, 'Nem található ilyen kedvenc.');

	return json(
		{ ...getUploadAuth(), folder: photoFolder(pet.id) },
		{ headers: { 'Cache-Control': 'no-store' } }
	);
};
