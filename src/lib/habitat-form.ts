// Validation of the habitat form. Pure code, no database. Kinds are stored as English keys;
// the labels and error messages come from the i18n dictionary.
import { getT, type MessageKey, type Translate } from './i18n/index.ts';

export const HABITAT_KINDS = [
	'aquarium',
	'terrarium',
	'pond',
	'garden',
	'enclosure',
	'other'
] as const;
export type HabitatKind = (typeof HABITAT_KINDS)[number];

export type HabitatInput = { name: string; kind: HabitatKind; notes: string | null };
export type HabitatField = 'name' | 'kind' | 'notes';
export type HabitatFormValues = { name: string; kind: string; notes: string };

export type HabitatFormResult =
	| { ok: true; value: HabitatInput }
	| { ok: false; errors: Partial<Record<HabitatField, string>>; values: HabitatFormValues };

const LIMITS = { name: 60, notes: 500 };

// "t" decides the language of the error messages (Hungarian by default).
export function parseHabitatForm(formData: FormData, t: Translate = getT('hu')): HabitatFormResult {
	const read = (key: string) => {
		const v = formData.get(key);
		return typeof v === 'string' ? v.trim() : '';
	};
	const values: HabitatFormValues = {
		name: read('name'),
		kind: read('kind'),
		notes: read('notes')
	};
	const errors: Partial<Record<HabitatField, string>> = {};

	if (values.name === '') {
		errors.name = t('pet.error.nameRequired');
	} else if (values.name.length > LIMITS.name) {
		errors.name = t('pet.error.nameTooLong', { max: LIMITS.name });
	}

	const kind = HABITAT_KINDS.find((k) => k === values.kind);
	if (!kind) errors.kind = t('habitat.error.kindRequired');

	if (values.notes.length > LIMITS.notes) {
		errors.notes = t('pet.error.notesTooLong', { max: LIMITS.notes });
	}

	if (Object.keys(errors).length > 0 || !kind) return { ok: false, errors, values };
	return { ok: true, value: { name: values.name, kind, notes: values.notes || null } };
}

// The stored kind stays an English key; this only decides how it is shown.
const KIND_LABEL_KEYS: Record<HabitatKind, MessageKey> = {
	aquarium: 'habitat.kind.aquarium',
	terrarium: 'habitat.kind.terrarium',
	pond: 'habitat.kind.pond',
	garden: 'habitat.kind.garden',
	enclosure: 'habitat.kind.enclosure',
	other: 'habitat.kind.other'
};

/** The display name of a stored kind; unknown values are shown as they are. */
export function kindLabel(kind: string, t: Translate): string {
	const key = (KIND_LABEL_KEYS as Record<string, MessageKey | undefined>)[kind];
	return key ? t(key) : kind;
}
