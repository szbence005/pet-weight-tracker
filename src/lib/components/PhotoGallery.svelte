<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import { upload } from '@imagekit/javascript';
	import { resizeImage } from '#lib/image-resize.ts';

	type Photo = {
		id: string;
		url: string;
		thumbUrl: string;
		caption: string | null;
	};

	let { petId, photos }: { petId: string; photos: Photo[] } = $props();

	let fileInput: HTMLInputElement | undefined = $state();
	let busy = $state(false);
	let progress = $state(0);
	let errorMessage = $state('');

	// Uploads straight from the browser to ImageKit and returns the new fileId.
	async function uploadToImageKit(file: File): Promise<string> {
		const authResponse = await fetch(`/pets/${petId}/upload-auth`, { method: 'POST' });
		if (!authResponse.ok) throw new Error('Nem sikerült engedélyt kérni a feltöltéshez.');
		const auth = await authResponse.json();

		const result = await upload({
			file,
			fileName: file.name,
			token: auth.token,
			expire: auth.expire,
			signature: auth.signature,
			publicKey: auth.publicKey,
			folder: auth.folder,
			isPrivateFile: true,
			useUniqueFileName: true,
			onProgress: (event) => {
				progress = Math.round((event.loaded / event.total) * 100);
			}
		});

		if (!result.fileId) throw new Error('Az ImageKit nem adott vissza fájlazonosítót.');
		return result.fileId;
	}

	// Runs before the form is sent: resize, upload, then add the fileId to the form data.
	const handleAdd: SubmitFunction = async ({ formData, cancel }) => {
		errorMessage = '';
		const file = fileInput?.files?.[0];
		if (!file) {
			errorMessage = 'Válassz ki egy képet.';
			cancel();
			return;
		}

		busy = true;
		progress = 0;
		try {
			const resized = await resizeImage(file);
			const fileId = await uploadToImageKit(resized);
			formData.set('fileId', fileId);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'A feltöltés nem sikerült.';
			busy = false;
			cancel();
			return;
		}

		return async ({ result, update }) => {
			busy = false;
			if (result.type === 'failure') {
				const message = result.data?.photoError;
				errorMessage = typeof message === 'string' ? message : 'A mentés nem sikerült.';
				return;
			}
			await update();
		};
	};

	const confirmDelete: SubmitFunction = ({ cancel }) => {
		if (!confirm('Biztosan törlöd ezt a fotót?')) cancel();
	};
</script>

<section>
	<h2>Fotók</h2>

	<form method="POST" action="?/photoAdd" use:enhance={handleAdd}>
		<label>
			Kép kiválasztása
			<input type="file" accept="image/*" bind:this={fileInput} disabled={busy} />
		</label>
		<label>
			Felirat (nem kötelező)
			<input type="text" name="caption" maxlength="200" disabled={busy} />
		</label>
		<button type="submit" aria-busy={busy} disabled={busy}>
			{busy ? 'Feltöltés...' : 'Feltöltés'}
		</button>
		{#if busy}
			<progress value={progress} max="100"></progress>
		{/if}
		{#if errorMessage}
			<p class="error" role="alert">{errorMessage}</p>
		{/if}
	</form>

	{#if photos.length === 0}
		<p>Még nincs feltöltött fotó.</p>
	{:else}
		<ul class="gallery">
			{#each photos as photo (photo.id)}
				<li>
					<a href={photo.url} target="_blank" rel="noreferrer">
						<img src={photo.thumbUrl} alt={photo.caption ?? 'A kedvenc fotója'} loading="lazy" />
					</a>
					{#if photo.caption}
						<small>{photo.caption}</small>
					{/if}
					<form method="POST" action="?/photoDelete" use:enhance={confirmDelete}>
						<input type="hidden" name="photoId" value={photo.id} />
						<button type="submit" class="outline secondary">Törlés</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.gallery {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1rem;
		padding: 0;
		list-style: none;
	}

	img {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
		border-radius: var(--pico-border-radius);
	}

	.error {
		color: var(--pico-del-color);
	}
</style>
