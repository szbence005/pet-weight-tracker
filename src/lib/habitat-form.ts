// Validation of the habitat form. Pure code, no database. Kinds are stored as English keys;
// the Hungarian labels belong to the UI.

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

export function parseHabitatForm(formData: FormData): HabitatFormResult {
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

	if (values.name === '') errors.name = 'Add meg a nevet.';
	else if (values.name.length > 60) errors.name = 'A n\u00e9v legfeljebb 60 karakter lehet.';

	const kind = HABITAT_KINDS.find((k) => k === values.kind);
	if (!kind) errors.kind = 'V\u00e1lassz t\u00edpust.';

	if (values.notes.length > 500) {
		errors.notes = 'A megjegyz\u00e9s legfeljebb 500 karakter lehet.';
	}

	if (Object.keys(errors).length > 0 || !kind) return { ok: false, errors, values };
	return { ok: true, value: { name: values.name, kind, notes: values.notes || null } };
}

export const HABITAT_KIND_LABELS: Record<HabitatKind, string> = {
	aquarium: 'Akv\u00e1rium',
	terrarium: 'Terr\u00e1rium',
	pond: 'T\u00f3',
	garden: 'Kert',
	enclosure: 'Kifut\u00f3',
	other: 'Egy\u00e9b'
};

export function kindLabel(kind: string): string {
	return (HABITAT_KIND_LABELS as Record<string, string>)[kind] ?? kind;
}
