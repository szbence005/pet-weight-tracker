import { fail, redirect } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth-guard.ts';
import { createHabitat, listHabitats } from '#lib/server/habitats.ts';
import { parseHabitatForm } from '#lib/habitat-form.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const habitats = await listHabitats(user.id);
	return { habitats };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const user = requireUser(locals);
		const result = parseHabitatForm(await request.formData());

		if (!result.ok) {
			return fail(400, { success: false as const, errors: result.errors, values: result.values });
		}

		const habitat = await createHabitat(user.id, result.value);
		// Go straight to the new habitat so the pets can be added.
		redirect(303, `/habitats/${habitat.id}`);
	}
};
