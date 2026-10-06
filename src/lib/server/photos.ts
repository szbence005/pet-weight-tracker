import { and, desc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { pets, photos } from '#lib/server/db/schema.ts';
import { deleteOwnedPet, getOwnedPet } from './pets.ts';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILE_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const SIGNED_URL_SECONDS = 300;

// The folder every photo of a pet must live in on ImageKit.
export function photoFolder(petId: string) {
	return `/pets/${petId}`;
}

// The part of an ImageKit file we look at (matches files.get in @imagekit/nodejs).
export type HostedFile = {
	fileId?: string;
	filePath?: string;
	isPrivateFile?: boolean;
	mime?: string;
	size?: number;
};

// What photos.ts needs from ImageKit. The real client is wired in separately,
// tests use a fake.
export interface ImageHost {
	getFile(fileId: string): Promise<HostedFile>;
	deleteFile(fileId: string): Promise<void>;
	signedUrl(filePath: string, options?: { width?: number }): string;
}

export type Photo = typeof photos.$inferSelect;

export type CreatePhotoResult =
	{ ok: true; photo: Photo } | { ok: false; reason: 'pet_not_found' | 'invalid_file' };

// The only way a photo gets into the database. The browser tells us a fileId,
// but we never trust what it says about the file: we ask ImageKit ourselves.
export async function createPhoto(
	userId: string,
	petId: string,
	host: ImageHost,
	input: { fileId: string; caption?: string | null }
): Promise<CreatePhotoResult> {
	const pet = await getOwnedPet(userId, petId);
	if (!pet) return { ok: false, reason: 'pet_not_found' };

	const invalid = { ok: false, reason: 'invalid_file' } as const;
	if (!FILE_ID_RE.test(input.fileId)) return invalid;

	let file: HostedFile;
	try {
		file = await host.getFile(input.fileId);
	} catch {
		return invalid;
	}

	const { fileId, filePath, mime, size } = file;
	if (fileId !== input.fileId || !filePath || !mime || !size) return invalid;
	if (file.isPrivateFile !== true) return invalid;
	if (!filePath.startsWith(`${photoFolder(pet.id)}/`)) return invalid;
	if (!PHOTO_TYPES.includes(mime)) return invalid;
	if (size <= 0 || size > MAX_PHOTO_BYTES) return invalid;

	// Saving the same file twice is harmless: return the existing row.
	const [existing] = await db
		.select()
		.from(photos)
		.where(and(eq(photos.petId, pet.id), eq(photos.imagekitFileId, fileId)));
	if (existing) return { ok: true, photo: existing };

	const [photo] = await db
		.insert(photos)
		.values({
			petId: pet.id,
			imagekitFileId: fileId,
			filePath,
			caption: input.caption?.trim().slice(0, 200) || null,
			contentType: mime,
			sizeBytes: size
		})
		.returning();
	return { ok: true, photo };
}

// Newest first, each with short-lived signed URLs (full size and thumbnail).
export async function listPhotos(userId: string, petId: string, host: ImageHost) {
	const pet = await getOwnedPet(userId, petId);
	if (!pet) return undefined;

	const rows = await db
		.select()
		.from(photos)
		.where(eq(photos.petId, pet.id))
		.orderBy(desc(photos.createdAt));

	return rows.map((photo) => ({
		...photo,
		url: host.signedUrl(photo.filePath, { width: 1200 }),
		thumbUrl: host.signedUrl(photo.filePath, { width: 400 })
	}));
}

export async function deletePhoto(
	userId: string,
	petId: string,
	photoId: string,
	host: ImageHost
): Promise<boolean> {
	if (!UUID_RE.test(photoId)) return false;
	const pet = await getOwnedPet(userId, petId);
	if (!pet) return false;

	const deleted = await db
		.delete(photos)
		.where(and(eq(photos.id, photoId), eq(photos.petId, pet.id)))
		.returning({ fileId: photos.imagekitFileId });
	if (deleted.length === 0) return false;

	// The database row is the source of truth. If ImageKit fails, we only
	// leave an orphan file behind, so log it instead of failing the request.
	try {
		await host.deleteFile(deleted[0].fileId);
	} catch (error) {
		console.error('ImageKit delete failed', error);
	}
	return true;
}

// Deletes a pet; the database cascade removes its photo rows. The ImageKit
// files are deleted afterwards, and a failure there only leaves orphan files.
export async function deletePetWithPhotos(
	userId: string,
	petId: string,
	host: ImageHost
): Promise<boolean> {
	const pet = await getOwnedPet(userId, petId);
	if (!pet) return false;

	// Collect the file ids first: the cascade removes the rows with the pet.
	const files = await db
		.select({ fileId: photos.imagekitFileId })
		.from(photos)
		.where(eq(photos.petId, pet.id));

	const deleted = await deleteOwnedPet(userId, pet.id);
	if (!deleted) return false;

	const results = await Promise.allSettled(files.map((file) => host.deleteFile(file.fileId)));
	for (const result of results) {
		if (result.status === 'rejected') console.error('ImageKit delete failed', result.reason);
	}
	return true;
}

// Makes one photo the avatar of its pet; any earlier avatar is switched off.
// Returns false if the pet is not the user's or the photo is not the pet's.
export async function setAvatar(userId: string, petId: string, photoId: string): Promise<boolean> {
	if (!UUID_RE.test(photoId)) return false;
	const pet = await getOwnedPet(userId, petId);
	if (!pet) return false;

	return db.transaction(async (tx) => {
		const [photo] = await tx
			.select({ id: photos.id })
			.from(photos)
			.where(and(eq(photos.id, photoId), eq(photos.petId, pet.id)));
		if (!photo) return false;

		await tx
			.update(photos)
			.set({ isAvatar: false })
			.where(and(eq(photos.petId, pet.id), eq(photos.isAvatar, true)));
		await tx.update(photos).set({ isAvatar: true }).where(eq(photos.id, photo.id));
		return true;
	});
}

// One signed thumbnail URL per pet that has an avatar, only for the user's own pets.
export async function listAvatarThumbs(userId: string, host: ImageHost) {
	const rows = await db
		.select({ petId: photos.petId, filePath: photos.filePath })
		.from(photos)
		.innerJoin(pets, eq(pets.id, photos.petId))
		.where(and(eq(pets.ownerId, userId), eq(photos.isAvatar, true)));

	const thumbs: Record<string, string> = {};
	for (const row of rows) thumbs[row.petId] = host.signedUrl(row.filePath, { width: 200 });
	return thumbs;
}
