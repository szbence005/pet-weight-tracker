import { error, fail, redirect } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth-guard.ts';
import { getOwnedPet, updateOwnedPet } from '#lib/server/pets.ts';
import { addWeight, deleteWeight, listWeights, updateWeight } from '#lib/server/weights.ts';
import { parsePetForm } from '#lib/pet-form.ts';
import { parseWeightForm } from '#lib/weight-form.ts';
import { getT } from '#lib/i18n/index.ts';
import {
	createPhoto,
	deletePetWithPhotos,
	deletePhoto,
	listPhotos,
	setAvatar
} from '#lib/server/photos.ts';
import { imageHost } from '#lib/server/imagekit.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = requireUser(locals);
	const t = getT(locals.locale);
	const pet = await getOwnedPet(user.id, params.id);
	// 404 (not 403): do not reveal that the pet exists for somebody else.
	if (!pet) error(404, t('pet.notFound'));
	const weights = (await listWeights(user.id, params.id)) ?? [];
	// Signed URLs are created here, only after getOwnedPet passed above.
	const photos = (await listPhotos(user.id, params.id, imageHost)) ?? [];
	return { pet, weights, photos };
};

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
		const user = requireUser(locals);
		const t = getT(locals.locale);
		const result = parsePetForm(await request.formData(), undefined, t);

		if (!result.ok) {
			return fail(400, { success: false as const, errors: result.errors, values: result.values });
		}

		const pet = await updateOwnedPet(user.id, params.id, result.value);
		if (!pet) error(404, t('pet.notFound'));
		return { success: true as const };
	},

	delete: async ({ locals, params }) => {
		const user = requireUser(locals);
		const t = getT(locals.locale);
		const deleted = await deletePetWithPhotos(user.id, params.id, imageHost);
		if (!deleted) error(404, t('pet.notFound'));
		redirect(303, '/pets');
	},

	weightAdd: async ({ request, locals, params }) => {
		const user = requireUser(locals);
		const t = getT(locals.locale);
		const result = parseWeightForm(await request.formData(), undefined, t);

		if (!result.ok) {
			return fail(400, {
				weightFailed: true as const,
				weightErrors: result.errors,
				weightValues: result.values
			});
		}

		const entry = await addWeight(user.id, params.id, result.value);
		if (!entry) error(404, t('pet.notFound'));
		return { weightSaved: true as const };
	},

	weightUpdate: async ({ request, locals, params }) => {
		const user = requireUser(locals);
		const t = getT(locals.locale);
		const formData = await request.formData();
		const entryId = formData.get('entryId');
		if (typeof entryId !== 'string') error(400, t('error.missingId'));

		const result = parseWeightForm(formData, undefined, t);
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
		if (!entry) error(404, t('weight.notFound'));
		return { weightUpdated: true as const };
	},

	photoAdd: async ({ request, locals, params }) => {
		const user = requireUser(locals);
		const t = getT(locals.locale);
		const formData = await request.formData();
		const fileId = formData.get('fileId');
		const caption = formData.get('caption');
		if (typeof fileId !== 'string') {
			return fail(400, { photoError: t('photo.error.missingFileId') });
		}

		// createPhoto checks ownership and asks ImageKit about the file itself.
		const result = await createPhoto(user.id, params.id, imageHost, {
			fileId,
			caption: typeof caption === 'string' ? caption : null
		});
		if (!result.ok) {
			if (result.reason === 'pet_not_found') error(404, t('pet.notFound'));
			return fail(400, { photoError: t('photo.error.rejected') });
		}
		return { photoSaved: true as const };
	},

	photoSetAvatar: async ({ request, locals, params }) => {
		const user = requireUser(locals);
		const t = getT(locals.locale);
		const photoId = (await request.formData()).get('photoId');
		if (typeof photoId !== 'string') error(400, t('error.missingId'));

		const done = await setAvatar(user.id, params.id, photoId);
		if (!done) error(404, t('photo.notFound'));
		return { avatarSet: true as const };
	},

	photoDelete: async ({ request, locals, params }) => {
		const user = requireUser(locals);
		const t = getT(locals.locale);
		const photoId = (await request.formData()).get('photoId');
		if (typeof photoId !== 'string') error(400, t('error.missingId'));

		const deleted = await deletePhoto(user.id, params.id, photoId, imageHost);
		if (!deleted) error(404, t('photo.notFound'));
		return { photoDeleted: true as const };
	},

	weightDelete: async ({ request, locals, params }) => {
		const user = requireUser(locals);
		const t = getT(locals.locale);
		const entryId = (await request.formData()).get('entryId');
		if (typeof entryId !== 'string') error(400, t('error.missingId'));

		const deleted = await deleteWeight(user.id, params.id, entryId);
		if (!deleted) error(404, t('weight.notFound'));
		return { weightDeleted: true as const };
	}
};
