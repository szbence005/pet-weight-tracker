export const SPECIES = [
	'teknős',
	'kutya',
	'macska',
	'nyúl',
	'hörcsög',
	'madár',
	'hal',
	'egyéb'
] as const;

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
export function parsePetForm(
	data: FormData,
	today = new Date().toISOString().slice(0, 10)
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
		errors.name = 'A név megadása kötelező.';
	} else if (values.name.length > LIMITS.name) {
		errors.name = `A név legfeljebb ${LIMITS.name} karakter lehet.`;
	}

	if (!(SPECIES as readonly string[]).includes(values.species)) {
		errors.species = 'Válassz egy fajt a listából.';
	}

	if (values.breed.length > LIMITS.breed) {
		errors.breed = `A fajta legfeljebb ${LIMITS.breed} karakter lehet.`;
	}

	if (values.birthDate) {
		if (!isValidDate(values.birthDate)) {
			errors.birthDate = 'Érvénytelen dátum.';
		} else if (values.birthDate > today) {
			errors.birthDate = 'A születési dátum nem lehet a jövőben.';
		}
	}

	if (values.notes.length > LIMITS.notes) {
		errors.notes = `A megjegyzés legfeljebb ${LIMITS.notes} karakter lehet.`;
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
