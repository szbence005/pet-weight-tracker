import { error, fail, redirect } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth-guard.ts';
import { listPets } from '#lib/server/pets.ts';
import {
	addPetToHabitat,
	deleteOwnedHabitat,
	listHabitats,
	removePetFromHabitat,
	updateOwnedHabitat
} from '#lib/server/habitats.ts';
import { parseHabitatForm } from '#lib/habitat-form.ts';
import type { Actions, PageServerLoad } from './$types';

const NOT_FOUND = 'Nem tal\u00e1lhat\u00f3 ilyen \u00e9l\u0151hely.';
const MISSING_ID = 'Hi\u00e1nyz\u00f3 azonos\u00edt\u00f3.';

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = requireUser(locals);
	// listHabitats only returns this user's habitats, so somebody else's id is simply not found.
	// 404 (not 403): do not reveal that the habitat exists for somebody else.
	const habitat = (await listHabitats(user.id)).find((h) => h.id === params.id);
	if (!habitat) error(404, NOT_FOUND);

	const inside = new Set(habitat.pets.map((p) => p.id));
	const candidates = (await listPets(user.id))
		.filter((p) => !inside.has(p.id))
		.map((p) => ({ id: p.id, name: p.name, species: p.species }));

	return { habitat, candidates };
};

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
		const user = requireUser(locals);
		const result = parseHabitatForm(await request.formData());

		if (!result.ok) {
			return fail(400, { success: false as const, errors: result.errors, values: result.values });
		}

		const habitat = await updateOwnedHabitat(user.id, params.id, result.value);
		if (!habitat) error(404, NOT_FOUND);
		return { success: true as const };
	},

	delete: async ({ locals, params }) => {
		const user = requireUser(locals);
		const deleted = await deleteOwnedHabitat(user.id, params.id);
		if (!deleted) error(404, NOT_FOUND);
		redirect(303, '/habitats');
	},

	addPet: async ({ request, locals, params }) => {
		const user = requireUser(locals);
		const petId = (await request.formData()).get('petId');
		if (typeof petId !== 'string') error(400, MISSING_ID);

		// Checks that the habitat AND the pet belong to the user.
		const done = await addPetToHabitat(user.id, params.id, petId);
		if (!done) error(404, NOT_FOUND);
		return { petAdded: true as const };
	},

	removePet: async ({ request, locals, params }) => {
		const user = requireUser(locals);
		const petId = (await request.formData()).get('petId');
		if (typeof petId !== 'string') error(400, MISSING_ID);

		const done = await removePetFromHabitat(user.id, params.id, petId);
		if (!done) error(404, NOT_FOUND);
		return { petRemoved: true as const };
	}
};
