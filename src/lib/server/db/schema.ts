import {
	pgTable,
	uuid,
	text,
	date,
	integer,
	boolean,
	timestamp,
	index,
	uniqueIndex,
	check,
	primaryKey
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth.schema';

export const pets = pgTable('pets', {
	id: uuid('id').primaryKey().defaultRandom(),
	ownerId: text('owner_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	species: text('species').notNull(),
	breed: text('breed'),
	birthDate: date('birth_date'),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const weightEntries = pgTable(
	'weight_entries',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		petId: uuid('pet_id')
			.notNull()
			.references(() => pets.id, { onDelete: 'cascade' }),
		weightGrams: integer('weight_grams').notNull(),
		measuredAt: date('measured_at').notNull(),
		note: text('note')
	},
	(t) => [
		index('weight_entries_pet_measured_idx').on(t.petId, t.measuredAt),
		check('weight_positive', sql`${t.weightGrams} > 0`)
	]
);

export const photos = pgTable(
	'photos',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		petId: uuid('pet_id')
			.notNull()
			.references(() => pets.id, { onDelete: 'cascade' }),
		imagekitFileId: text('imagekit_file_id').notNull(),
		filePath: text('file_path').notNull(),
		caption: text('caption'),
		takenAt: timestamp('taken_at', { withTimezone: true }),
		contentType: text('content_type').notNull(),
		sizeBytes: integer('size_bytes').notNull(),
		isAvatar: boolean('is_avatar').notNull().default(false),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		index('photos_pet_created_idx').on(t.petId, t.createdAt),
		uniqueIndex('photos_one_avatar_per_pet_idx')
			.on(t.petId)
			.where(sql`${t.isAvatar}`)
	]
);

// A place where pets live together (aquarium, pond, ...). Owned by one user.
export const habitats = pgTable(
	'habitats',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		ownerId: text('owner_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		kind: text('kind').notNull(),
		notes: text('notes'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('habitats_owner_idx').on(t.ownerId)]
);

// Which pet lives in which habitat. A pet may be in several habitats.
export const habitatPets = pgTable(
	'habitat_pets',
	{
		habitatId: uuid('habitat_id')
			.notNull()
			.references(() => habitats.id, { onDelete: 'cascade' }),
		petId: uuid('pet_id')
			.notNull()
			.references(() => pets.id, { onDelete: 'cascade' }),
		addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		primaryKey({ columns: [t.habitatId, t.petId] }),
		index('habitat_pets_pet_idx').on(t.petId)
	]
);
// Per-user settings. Only the UI language for now ('hu' or 'en').
export const userSettings = pgTable(
	'user_settings',
	{
		userId: text('user_id')
			.primaryKey()
			.references(() => user.id, { onDelete: 'cascade' }),
		locale: text('locale').notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [check('user_settings_locale_valid', sql`${t.locale} in ('hu', 'en')`)]
);
export * from './auth.schema';
