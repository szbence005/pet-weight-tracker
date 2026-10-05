const MAX_SIDE = 1600;
const QUALITY = 0.85;

// Shrinks the photo and re-encodes it as JPEG. Re-encoding drops EXIF data (including GPS).
export async function resizeImage(file: File): Promise<File> {
	const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
	const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
	const width = Math.round(bitmap.width * scale);
	const height = Math.round(bitmap.height * scale);

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;

	const context = canvas.getContext('2d');
	if (!context) {
		bitmap.close();
		throw new Error('A böngésző nem tudja átméretezni a képet.');
	}
	context.drawImage(bitmap, 0, 0, width, height);
	bitmap.close();

	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob(resolve, 'image/jpeg', QUALITY)
	);
	if (!blob) throw new Error('A kép átalakítása nem sikerült.');

	const baseName = file.name.replace(/\.[^.]+$/, '') || 'foto';
	return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
}
