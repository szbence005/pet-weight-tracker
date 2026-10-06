import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { inArray } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { user } from '#lib/server/db/schema.ts';
import { createPet, getOwnedPet } from './pets.ts';
import {
	MAX_PHOTO_BYTES,
	createPhoto,
	deletePetWithPhotos,
	deletePhoto,
	listPhotos,
	setAvatar,
	listAvatarThumbs,
	photoFolder,
	type HostedFile,
	type ImageHost
} from './photos.ts';

const userAId = `test-a-${crypto.randomUUID()}`;
const userBId = `test-b-${crypto.randomUUID()}`;

// Every test gets its own fresh pets, so tests do not affect each other.
async function newPet(ownerId: string) {
	const pet = await createPet(ownerId, {
		name: 'Teszt',
		species: 'kutya',
		breed: null,
		birthDate: null,
		notes: null
	});
	if (!pet) throw new Error('test setup failed');
	return pet.id;
}

const newFileId = () => `f${crypto.randomUUID().replaceAll('-', '')}`;

// A file as ImageKit would report it for a correct upload.
function goodFile(petId: string, fileId: string, overrides: Partial<HostedFile> = {}): HostedFile {
	return {
		fileId,
		filePath: `${photoFolder(petId)}/${fileId}.jpg`,
		isPrivateFile: true,
		mime: 'image/jpeg',
		size: 1000,
		...overrides
	};
}

// Fake ImageKit: knows only the files we give it and records what was called.
function fakeHost(files: HostedFile[] = [], options: { failDelete?: boolean } = {}) {
	const asked: string[] = [];
	const deleted: string[] = [];
	const host: ImageHost = {
		async getFile(fileId) {
			asked.push(fileId);
			const file = files.find((f) => f.fileId === fileId);
			if (!file) throw new Error('not found');
			return file;
		},
		async deleteFile(fileId) {
			deleted.push(fileId);
			if (options.failDelete) throw new Error('imagekit down');
		},
		signedUrl(filePath, opts) {
			return `https://signed.test${filePath}?w=${opts?.width ?? 0}`;
		}
	};
	return { host, asked, deleted };
}

// Saves one valid photo for the owner and returns it.
async function addPhoto(ownerId: string, petId: string, caption?: string) {
	const fileId = newFileId();
	const { host } = fakeHost([goodFile(petId, fileId)]);
	const result = await createPhoto(ownerId, petId, host, { fileId, caption });
	if (!result.ok) throw new Error('test setup failed');
	return result.photo;
}

beforeAll(async () => {
	await db.insert(user).values([
		{ id: userAId, name: 'Test A', email: `${userAId}@example.test` },
		{ id: userBId, name: 'Test B', email: `${userBId}@example.test` }
	]);
});

afterAll(async () => {
	// Deleting the users also deletes pets and photos (ON DELETE CASCADE).
	await db.delete(user).where(inArray(user.id, [userAId, userBId]));
});

describe('photos: createPhoto', () => {
	it('saves a valid file, taking type and size from ImageKit', async () => {
		const petId = await newPet(userAId);
		const fileId = newFileId();
		const { host } = fakeHost([goodFile(petId, fileId, { mime: 'image/webp', size: 4321 })]);

		const result = await createPhoto(userAId, petId, host, { fileId, caption: '  Alvás  ' });
		if (!result.ok) throw new Error('expected ok');

		expect(result.photo.imagekitFileId).toBe(fileId);
		expect(result.photo.contentType).toBe('image/webp');
		expect(result.photo.sizeBytes).toBe(4321);
		expect(result.photo.caption).toBe('Alvás');
		expect(result.photo.filePath.startsWith(`${photoFolder(petId)}/`)).toBe(true);
	});

	it("another user cannot add a photo to somebody else's pet", async () => {
		const petId = await newPet(userAId);
		const fileId = newFileId();
		const { host, asked } = fakeHost([goodFile(petId, fileId)]);

		const result = await createPhoto(userBId, petId, host, { fileId });
		expect(result).toEqual({ ok: false, reason: 'pet_not_found' });
		expect(asked).toEqual([]);
		expect(await listPhotos(userAId, petId, host)).toEqual([]);
	});

	it('rejects a public file', async () => {
		const petId = await newPet(userAId);
		const fileId = newFileId();
		const { host } = fakeHost([goodFile(petId, fileId, { isPrivateFile: false })]);

		expect(await createPhoto(userAId, petId, host, { fileId })).toEqual({
			ok: false,
			reason: 'invalid_file'
		});
	});

	it("rejects a file that lives in another pet's folder", async () => {
		const petId = await newPet(userAId);
		const otherPetId = await newPet(userAId);
		const fileId = newFileId();
		const { host } = fakeHost([goodFile(otherPetId, fileId)]);

		expect(await createPhoto(userAId, petId, host, { fileId })).toEqual({
			ok: false,
			reason: 'invalid_file'
		});
		expect(await listPhotos(userAId, petId, host)).toEqual([]);
	});

	it('rejects a file that is not a supported image', async () => {
		const petId = await newPet(userAId);
		const fileId = newFileId();
		const { host } = fakeHost([goodFile(petId, fileId, { mime: 'application/pdf' })]);

		expect(await createPhoto(userAId, petId, host, { fileId })).toEqual({
			ok: false,
			reason: 'invalid_file'
		});
	});

	it('rejects a file that is too big', async () => {
		const petId = await newPet(userAId);
		const fileId = newFileId();
		const { host } = fakeHost([goodFile(petId, fileId, { size: MAX_PHOTO_BYTES + 1 })]);

		expect(await createPhoto(userAId, petId, host, { fileId })).toEqual({
			ok: false,
			reason: 'invalid_file'
		});
	});

	it('rejects a file id that ImageKit does not know', async () => {
		const petId = await newPet(userAId);
		const { host } = fakeHost([]);

		expect(await createPhoto(userAId, petId, host, { fileId: newFileId() })).toEqual({
			ok: false,
			reason: 'invalid_file'
		});
	});

	it('rejects a malformed file id without asking ImageKit', async () => {
		const petId = await newPet(userAId);
		const { host, asked } = fakeHost([]);

		expect(await createPhoto(userAId, petId, host, { fileId: '../etc?x=1' })).toEqual({
			ok: false,
			reason: 'invalid_file'
		});
		expect(asked).toEqual([]);
	});

	it('saving the same file twice gives one row', async () => {
		const petId = await newPet(userAId);
		const fileId = newFileId();
		const { host } = fakeHost([goodFile(petId, fileId)]);

		const first = await createPhoto(userAId, petId, host, { fileId });
		const second = await createPhoto(userAId, petId, host, { fileId });
		if (!first.ok || !second.ok) throw new Error('expected ok');

		expect(second.photo.id).toBe(first.photo.id);
		expect((await listPhotos(userAId, petId, host))?.length).toBe(1);
	});
});

describe('photos: list and delete', () => {
	it('lists photos newest first with signed urls', async () => {
		const petId = await newPet(userAId);
		await addPhoto(userAId, petId, 'régi');
		await addPhoto(userAId, petId, 'új');
		const { host } = fakeHost();

		const list = await listPhotos(userAId, petId, host);
		expect(list?.map((p) => p.caption)).toEqual(['új', 'régi']);
		expect(list?.[0].url).toContain('?w=1200');
		expect(list?.[0].thumbUrl).toContain('?w=400');
	});

	it("another user cannot list somebody else's photos", async () => {
		const petId = await newPet(userAId);
		await addPhoto(userAId, petId);
		const { host } = fakeHost();

		expect(await listPhotos(userBId, petId, host)).toBeUndefined();
	});

	it('the owner can delete a photo, also from ImageKit', async () => {
		const petId = await newPet(userAId);
		const photo = await addPhoto(userAId, petId);
		const { host, deleted } = fakeHost();

		expect(await deletePhoto(userAId, petId, photo.id, host)).toBe(true);
		expect(deleted).toEqual([photo.imagekitFileId]);
		expect(await listPhotos(userAId, petId, host)).toEqual([]);
	});

	it('another user cannot delete a photo', async () => {
		const petId = await newPet(userAId);
		const photo = await addPhoto(userAId, petId);
		const { host, deleted } = fakeHost();

		expect(await deletePhoto(userBId, petId, photo.id, host)).toBe(false);
		expect(deleted).toEqual([]);
		expect((await listPhotos(userAId, petId, host))?.length).toBe(1);
	});

	it('a photo is not reachable through another pet, even of the same owner', async () => {
		const petId = await newPet(userAId);
		const otherPetId = await newPet(userAId);
		const photo = await addPhoto(userAId, petId);
		const { host, deleted } = fakeHost();

		expect(await deletePhoto(userAId, otherPetId, photo.id, host)).toBe(false);
		expect(deleted).toEqual([]);
		expect((await listPhotos(userAId, petId, host))?.length).toBe(1);
	});

	it('rejects a malformed photo id', async () => {
		const petId = await newPet(userAId);
		const { host } = fakeHost();

		expect(await deletePhoto(userAId, petId, 'nope', host)).toBe(false);
	});

	it('still succeeds when deleting from ImageKit fails', async () => {
		const petId = await newPet(userAId);
		const photo = await addPhoto(userAId, petId);
		const { host } = fakeHost([], { failDelete: true });

		expect(await deletePhoto(userAId, petId, photo.id, host)).toBe(true);
		expect(await listPhotos(userAId, petId, host)).toEqual([]);
	});
});

describe('photos: deletePetWithPhotos', () => {
	it('deletes the pet and all its files from ImageKit', async () => {
		const petId = await newPet(userAId);
		const first = await addPhoto(userAId, petId);
		const second = await addPhoto(userAId, petId);
		const { host, deleted } = fakeHost();

		expect(await deletePetWithPhotos(userAId, petId, host)).toBe(true);
		expect([...deleted].sort()).toEqual([first.imagekitFileId, second.imagekitFileId].sort());
		expect(await getOwnedPet(userAId, petId)).toBeUndefined();
	});

	it("another user cannot delete somebody else's pet or its files", async () => {
		const petId = await newPet(userAId);
		await addPhoto(userAId, petId);
		const { host, deleted } = fakeHost();

		expect(await deletePetWithPhotos(userBId, petId, host)).toBe(false);
		expect(deleted).toEqual([]);
		expect(await getOwnedPet(userAId, petId)).toBeDefined();
		expect((await listPhotos(userAId, petId, host))?.length).toBe(1);
	});

	it('still deletes the pet when deleting from ImageKit fails', async () => {
		const petId = await newPet(userAId);
		await addPhoto(userAId, petId);
		const { host } = fakeHost([], { failDelete: true });

		expect(await deletePetWithPhotos(userAId, petId, host)).toBe(true);
		expect(await getOwnedPet(userAId, petId)).toBeUndefined();
	});
});

describe('photos: setAvatar', () => {
	it('sets the avatar and moves it when another photo is chosen', async () => {
		const petId = await newPet(userAId);
		const first = await addPhoto(userAId, petId);
		const second = await addPhoto(userAId, petId);
		const { host } = fakeHost();
		const avatarIds = async () =>
			((await listPhotos(userAId, petId, host)) ?? []).filter((p) => p.isAvatar).map((p) => p.id);

		expect(await avatarIds()).toEqual([]);
		expect(await setAvatar(userAId, petId, first.id)).toBe(true);
		expect(await avatarIds()).toEqual([first.id]);
		expect(await setAvatar(userAId, petId, second.id)).toBe(true);
		expect(await avatarIds()).toEqual([second.id]);
	});

	it("another user cannot set an avatar on somebody else's pet", async () => {
		const petId = await newPet(userAId);
		const photo = await addPhoto(userAId, petId);
		const { host } = fakeHost();

		expect(await setAvatar(userBId, petId, photo.id)).toBe(false);
		expect((await listPhotos(userAId, petId, host))?.some((p) => p.isAvatar)).toBe(false);
	});

	it("a photo of another pet cannot become this pet's avatar", async () => {
		const petId = await newPet(userAId);
		const otherPetId = await newPet(userAId);
		const photo = await addPhoto(userAId, otherPetId);
		const { host } = fakeHost();

		expect(await setAvatar(userAId, petId, photo.id)).toBe(false);
		expect((await listPhotos(userAId, otherPetId, host))?.some((p) => p.isAvatar)).toBe(false);
	});

	it('rejects a malformed photo id', async () => {
		const petId = await newPet(userAId);

		expect(await setAvatar(userAId, petId, 'nope')).toBe(false);
	});
});

describe('photos: listAvatarThumbs', () => {
	it('returns a signed thumbnail only for pets that have an avatar', async () => {
		const withAvatar = await newPet(userAId);
		const withoutAvatar = await newPet(userAId);
		const photo = await addPhoto(userAId, withAvatar);
		await addPhoto(userAId, withoutAvatar);
		await setAvatar(userAId, withAvatar, photo.id);
		const { host } = fakeHost();

		const thumbs = await listAvatarThumbs(userAId, host);
		expect(thumbs[withAvatar]).toContain('?w=200');
		expect(thumbs[withoutAvatar]).toBeUndefined();
	});

	it("does not include another user's avatars", async () => {
		const petId = await newPet(userAId);
		const photo = await addPhoto(userAId, petId);
		await setAvatar(userAId, petId, photo.id);
		const { host } = fakeHost();

		expect((await listAvatarThumbs(userBId, host))[petId]).toBeUndefined();
	});
});
