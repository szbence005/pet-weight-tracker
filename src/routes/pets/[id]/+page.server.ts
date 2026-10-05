import { error, fail, redirect } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth-guard.ts';
import { deleteOwnedPet, getOwnedPet, updateOwnedPet } from '#lib/server/pets.ts';
import { parsePetForm } from '#lib/pet-form.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = requireUser(locals);
	const pet = await getOwnedPet(user.id, params.id);
	// 404 (not 403): do not reveal that the pet exists for somebody else.
	if (!pet) error(404, 'Nem található ilyen kedvenc.');
	return { pet };
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
	}
};
