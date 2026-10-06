import { fail } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth-guard.ts';
import { createPet, listPets } from '#lib/server/pets.ts';
import { listAvatarThumbs } from '#lib/server/photos.ts';
import { imageHost } from '#lib/server/imagekit.ts';
import { parsePetForm } from '#lib/pet-form.ts';
import { getT } from '#lib/i18n/index.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const pets = await listPets(user.id);
	const avatars = await listAvatarThumbs(user.id, imageHost);
	return { pets, avatars };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const user = requireUser(locals);
		const result = parsePetForm(await request.formData(), undefined, getT(locals.locale));

		if (!result.ok) {
			return fail(400, { success: false as const, errors: result.errors, values: result.values });
		}

		await createPet(user.id, result.value);
		return { success: true as const };
	}
};
