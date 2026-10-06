import { error, fail, redirect } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth-guard.ts';
import { getOwnedPet, updateOwnedPet } from '#lib/server/pets.ts';
import { addWeight, deleteWeight, listWeights, updateWeight } from '#lib/server/weights.ts';
import { parsePetForm } from '#lib/pet-form.ts';
import { parseWeightForm } from '#lib/weight-form.ts';
import { createPhoto, deletePetWithPhotos, deletePhoto, listPhotos } from '#lib/server/photos.ts';
import { imageHost } from '#lib/server/imagekit.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = requireUser(locals);
	const pet = await getOwnedPet(user.id, params.id);
	// 404 (not 403): do not reveal that the pet exists for somebody else.
	if (!pet) error(404, 'Nem található ilyen kedvenc.');
	const weights = (await listWeights(user.id, params.id)) ?? [];
	// Signed URLs are created here, only after getOwnedPet passed above.
	const photos = (await listPhotos(user.id, params.id, imageHost)) ?? [];
	return { pet, weights, photos };
};

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
		const user = requireUser(locals);
		const result = parsePetForm(await request.formData());

		if (!result.ok) {
			return fail(400, { success: false as const, errors: result.errors, values: result.values });
		}

		const pet = await updateOwnedPet(user.id, params.id, result.value);
		if (!pet) error(404, 'Nem található ilyen kedvenc.');
		return { success: true as const };
	},

	delete: async ({ locals, params }) => {
		const user = requireUser(locals);
		const deleted = await deletePetWithPhotos(user.id, params.id, imageHost);
		if (!deleted) error(404, 'Nem található ilyen kedvenc.');
		redirect(303, '/pets');
	},

	weightAdd: async ({ request, locals, params }) => {
		const user = requireUser(locals);
		const result = parseWeightForm(await request.formData());

		if (!result.ok) {
			return fail(400, {
				weightFailed: true as const,
				weightErrors: result.errors,
				weightValues: result.values
			});
		}

		const entry = await addWeight(user.id, params.id, result.value);
		if (!entry) error(404, 'Nem található ilyen kedvenc.');
		return { weightSaved: true as const };
	},

	weightUpdate: async ({ request, locals, params }) => {
		const user = requireUser(locals);
		const formData = await request.formData();
		const entryId = formData.get('entryId');
		if (typeof entryId !== 'string') error(400, 'Hiányzó azonosító.');

		const result = parseWeightForm(formData);
		if (!result.ok) {
			// The entryId tells the page which row the errors belong to.
			return fail(400, {
				weightUpdateFailed: true as const,
				weightUpdateEntryId: entryId,
				weightUpdateErrors: result.errors,
				weightUpdateValues: result.values
			});
		}

		// Ownership is checked inside updateWeight (pet AND entry).
		const entry = await updateWeight(user.id, params.id, entryId, result.value);
		if (!entry) error(404, 'Nem található ilyen bejegyzés.');
		return { weightUpdated: true as const };
	},

	photoAdd: async ({ request, locals, params }) => {
		const user = requireUser(locals);
		const formData = await request.formData();
		const fileId = formData.get('fileId');
		const caption = formData.get('caption');
		if (typeof fileId !== 'string') {
			return fail(400, { photoError: 'Hiányzó fájlazonosító.' });
		}

		// createPhoto checks ownership and asks ImageKit about the file itself.
		const result = await createPhoto(user.id, params.id, imageHost, {
			fileId,
			caption: typeof caption === 'string' ? caption : null
		});
		if (!result.ok) {
			if (result.reason === 'pet_not_found') error(404, 'Nem található ilyen kedvenc.');
			return fail(400, {
				photoError: 'A fájl nem fogadható el (JPEG, PNG vagy WebP, legfeljebb 5 MB lehet).'
			});
		}
		return { photoSaved: true as const };
	},

	photoDelete: async ({ request, locals, params }) => {
		const user = requireUser(locals);
		const photoId = (await request.formData()).get('photoId');
		if (typeof photoId !== 'string') error(400, 'Hiányzó azonosító.');

		const deleted = await deletePhoto(user.id, params.id, photoId, imageHost);
		if (!deleted) error(404, 'Nem található ilyen fotó.');
		return { photoDeleted: true as const };
	},

	weightDelete: async ({ request, locals, params }) => {
		const user = requireUser(locals);
		const entryId = (await request.formData()).get('entryId');
		if (typeof entryId !== 'string') error(400, 'Hiányzó azonosító.');

		const deleted = await deleteWeight(user.id, params.id, entryId);
		if (!deleted) error(404, 'Nem található ilyen bejegyzés.');
		return { weightDeleted: true as const };
	}
};
