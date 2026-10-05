import { error, fail, redirect } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth-guard.ts';
import { deleteOwnedPet, getOwnedPet, updateOwnedPet } from '#lib/server/pets.ts';
import { addWeight, deleteWeight, listWeights } from '#lib/server/weights.ts';
import { parsePetForm } from '#lib/pet-form.ts';
import { parseWeightForm } from '#lib/weight-form.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = requireUser(locals);
	const pet = await getOwnedPet(user.id, params.id);
	// 404 (not 403): do not reveal that the pet exists for somebody else.
	if (!pet) error(404, 'Nem található ilyen kedvenc.');
	const weights = (await listWeights(user.id, params.id)) ?? [];
	return { pet, weights };
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
		const deleted = await deleteOwnedPet(user.id, params.id);
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

	weightDelete: async ({ request, locals, params }) => {
		const user = requireUser(locals);
		const entryId = (await request.formData()).get('entryId');
		if (typeof entryId !== 'string') error(400, 'Hiányzó azonosító.');

		const deleted = await deleteWeight(user.id, params.id, entryId);
		if (!deleted) error(404, 'Nem található ilyen bejegyzés.');
		return { weightDeleted: true as const };
	}
};
