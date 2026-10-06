<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import { upload } from '@imagekit/javascript';
	import { resizeImage } from '#lib/image-resize.ts';
	import Icon from '#lib/components/Icon.svelte';

	type Photo = {
		id: string;
		url: string;
		thumbUrl: string;
		caption: string | null;
		isAvatar: boolean;
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
	<article>
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
				<progress value={progress} max="100" aria-label="Feltöltés állapota"></progress>
			{/if}
			{#if errorMessage}
				<p class="error" role="alert">{errorMessage}</p>
			{/if}
		</form>
	</article>

	{#if photos.length === 0}
		<article class="empty">
			<p class="muted">Még nincs feltöltött fotó.</p>
		</article>
	{:else}
		<ul class="gallery">
			{#each photos as photo (photo.id)}
				<li class="tile">
					<a href={photo.url} target="_blank" rel="noreferrer">
						<img src={photo.thumbUrl} alt={photo.caption ?? 'A kedvenc fotója'} loading="lazy" />
						{#if photo.isAvatar}<span class="badge"><Icon name="star-fill" size={12} /> Avatar</span
							>{/if}
					</a>
					{#if photo.caption}
						<small class="caption">{photo.caption}</small>
					{/if}
					<div class="actions">
						{#if !photo.isAvatar}
							<form method="POST" action="?/photoSetAvatar" use:enhance>
								<input type="hidden" name="photoId" value={photo.id} />
								<button type="submit" class="outline small"
									><Icon name="star-fill" size={12} /> Avatar legyen</button
								>
							</form>
						{/if}
						<form method="POST" action="?/photoDelete" use:enhance={confirmDelete}>
							<input type="hidden" name="photoId" value={photo.id} />
							<button
								type="submit"
								class="outline secondary small icon-btn"
								aria-label="Fotó törlése"
								title="Fotó törlése"><Icon name="trash" /></button
							>
						</form>
					</div>
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

	.tile {
		position: relative;
		margin: 0;
		padding: 0.5rem;
		border: 1px solid var(--gh-border);
		border-radius: var(--pico-border-radius);
		background: var(--gh-canvas);
	}

	.tile a {
		position: relative;
		display: block;
	}

	img {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
		border-radius: var(--pico-border-radius);
		display: block;
	}

	.badge {
		position: absolute;
		top: 0.4rem;
		left: 0.4rem;
		padding: 0.1rem 0.5rem;
		border-radius: 2rem;
		background: var(--gh-success);
		color: #fff;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.caption {
		display: block;
		margin-top: 0.4rem;
		color: var(--gh-muted);
		overflow-wrap: anywhere;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-top: 0.5rem;
	}

	.actions form {
		margin: 0;
	}

	progress {
		margin-block: 0.75rem;
	}
</style>
