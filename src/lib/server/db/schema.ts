import { pgTable, uuid, text, date, integer, timestamp, index, check } from 'drizzle-orm/pg-core';
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
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('photos_pet_created_idx').on(t.petId, t.createdAt)]
);

export * from './auth.schema';
