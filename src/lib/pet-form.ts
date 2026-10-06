import { getT, type MessageKey, type Translate } from './i18n/index.ts';

export const SPECIES = [
	'tekn\u0151s',
	'kutya',
	'macska',
	'ny\u00fal',
	'h\u00f6rcs\u00f6g',
	'mad\u00e1r',
	'hal',
	'egy\u00e9b'
] as const;

// The stored value stays Hungarian; this only decides how a species is shown.
const SPECIES_LABEL_KEYS: Record<(typeof SPECIES)[number], MessageKey> = {
	'tekn\u0151s': 'species.turtle',
	kutya: 'species.dog',
	macska: 'species.cat',
	'ny\u00fal': 'species.rabbit',
	'h\u00f6rcs\u00f6g': 'species.hamster',
	'mad\u00e1r': 'species.bird',
	hal: 'species.fish',
	'egy\u00e9b': 'species.other'
};

/** The display name of a stored species; unknown values are shown as they are. */
export function speciesLabel(species: string, t: Translate): string {
	const key = (SPECIES_LABEL_KEYS as Record<string, MessageKey | undefined>)[species];
	return key ? t(key) : species;
}

const LIMITS = { name: 60, breed: 60, notes: 500 };

export type PetField = 'name' | 'species' | 'breed' | 'birthDate' | 'notes';

export type PetInput = {
	name: string;
	species: string;
	breed: string | null;
	birthDate: string | null;
	notes: string | null;
};

export type PetFormResult =
	| { ok: true; value: PetInput }
	| {
			ok: false;
			errors: Partial<Record<PetField, string>>;
			values: Record<PetField, string>;
	  };

function isValidDate(value: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const date = new Date(`${value}T00:00:00Z`);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// "today" is a parameter so that tests do not depend on the real date.
// "t" decides the language of the error messages (Hungarian by default).
export function parsePetForm(
	data: FormData,
	today = new Date().toISOString().slice(0, 10),
	t: Translate = getT('hu')
): PetFormResult {
	const text = (key: string) => data.get(key)?.toString().trim() ?? '';
	const values: Record<PetField, string> = {
		name: text('name'),
		species: text('species'),
		breed: text('breed'),
		birthDate: text('birthDate'),
		notes: text('notes')
	};
	const errors: Partial<Record<PetField, string>> = {};

	if (!values.name) {
		errors.name = t('pet.error.nameRequired');
	} else if (values.name.length > LIMITS.name) {
		errors.name = t('pet.error.nameTooLong', { max: LIMITS.name });
	}

	if (!(SPECIES as readonly string[]).includes(values.species)) {
		errors.species = t('pet.error.speciesInvalid');
	}

	if (values.breed.length > LIMITS.breed) {
		errors.breed = t('pet.error.breedTooLong', { max: LIMITS.breed });
	}

	if (values.birthDate) {
		if (!isValidDate(values.birthDate)) {
			errors.birthDate = t('pet.error.dateInvalid');
		} else if (values.birthDate > today) {
			errors.birthDate = t('pet.error.dateFuture');
		}
	}

	if (values.notes.length > LIMITS.notes) {
		errors.notes = t('pet.error.notesTooLong', { max: LIMITS.notes });
	}

	if (Object.keys(errors).length > 0) return { ok: false, errors, values };

	return {
		ok: true,
		value: {
			name: values.name,
			species: values.species,
			breed: values.breed || null,
			birthDate: values.birthDate || null,
			notes: values.notes || null
		}
	};
}
