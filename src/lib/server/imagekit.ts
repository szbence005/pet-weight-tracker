import ImageKit from '@imagekit/nodejs';
import { IMAGEKIT_PRIVATE_KEY, IMAGEKIT_PUBLIC_KEY, IMAGEKIT_URL_ENDPOINT } from '$app/env/private';
import { SIGNED_URL_SECONDS, type ImageHost } from '#lib/server/photos.ts';

// The client is created on first use, so importing this file never needs the keys.
let client: ImageKit | undefined;

function getClient(): ImageKit {
	if (!IMAGEKIT_PRIVATE_KEY) throw new Error('IMAGEKIT_PRIVATE_KEY is not set');
	client ??= new ImageKit({ privateKey: IMAGEKIT_PRIVATE_KEY });
	return client;
}

// The real ImageHost used by routes. Tests use a fake one instead.
export const imageHost: ImageHost = {
	getFile: (fileId) => getClient().files.get(fileId),

	deleteFile: async (fileId) => {
		await getClient().files.delete(fileId);
	},

	signedUrl: (filePath, options) =>
		getClient().helper.buildSrc({
			urlEndpoint: IMAGEKIT_URL_ENDPOINT,
			src: filePath,
			signed: true,
			expiresIn: SIGNED_URL_SECONDS,
			transformation: options?.width ? [{ width: options.width }] : undefined
		})
};
// Parameters the browser needs to upload one file straight to ImageKit.
// The signature only covers token + expire, so createPhoto re-checks every file.
export function getUploadAuth() {
	if (!IMAGEKIT_PUBLIC_KEY) throw new Error('IMAGEKIT_PUBLIC_KEY is not set');
	const { token, expire, signature } = getClient().helper.getAuthenticationParameters();
	return { token, expire, signature, publicKey: IMAGEKIT_PUBLIC_KEY };
}
