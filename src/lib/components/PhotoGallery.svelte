<script lang="ts">
    import { enhance, type SubmitFunction } from '$app/forms';
    import { upload } from '@imagekit/javascript';
    import { resizeImage } from '#lib/image-resize.ts';
    import Icon from '#lib/components/Icon.svelte';
    import { useT } from '#lib/i18n/context.ts';

    type Photo = {
        id: string;
        url: string;
        thumbUrl: string;
        caption: string | null;
        isAvatar: boolean;
    };

    let { petId, photos }: { petId: string; photos: Photo[] } = $props();
    const t = useT();

    let fileInput: HTMLInputElement | undefined = $state();
    let cameraInput: HTMLInputElement | undefined = $state();
    let cameraForm: HTMLFormElement | undefined = $state();
    let busy = $state(false);
    let progress = $state(0);
    let errorMessage = $state('');

    // Uploads straight from the browser to ImageKit and returns the new fileId.
    async function uploadToImageKit(file: File): Promise<string> {
        const authResponse = await fetch(`/pets/${petId}/upload-auth`, { method: 'POST' });
        if (!authResponse.ok) throw new Error(t('photo.error.authFailed'));
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

        if (!result.fileId) throw new Error(t('photo.error.noFileId'));
        return result.fileId;
    }

    // Runs before the form is sent: resize, upload, then add the fileId to the form data.
    // Used by both the normal file form and the camera form; they differ only in the input.
    function makeAddHandler(getInput: () => HTMLInputElement | undefined): SubmitFunction {
        return async ({ formData, cancel }) => {
            errorMessage = '';
            const file = getInput()?.files?.[0];
            if (!file) {
                errorMessage = t('photo.error.pickFile');
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
                errorMessage = error instanceof Error ? error.message : t('photo.error.uploadFailed');
                busy = false;
                cancel();
                return;
            }

            return async ({ result, update }) => {
                busy = false;
                if (result.type === 'failure') {
                    const message = result.data?.photoError;
                    errorMessage = typeof message === 'string' ? message : t('photo.error.saveFailed');
                    return;
                }
                await update();
            };
        };
    }

    const handleAdd = makeAddHandler(() => fileInput);
    const handleCamera = makeAddHandler(() => cameraInput);

    const confirmDelete: SubmitFunction = ({ cancel }) => {
        if (!confirm(t('photo.deleteConfirm'))) cancel();
    };
</script>

<section>
    <article>
        <!-- Quick upload: on a phone `capture` opens the camera, on a computer a normal file picker.
             The upload starts as soon as a photo has been taken or chosen (no caption). -->
        <form method="POST" action="?/photoAdd" use:enhance={handleCamera} bind:this={cameraForm}>
            <input
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                bind:this={cameraInput}
                onchange={() => cameraForm?.requestSubmit()}
            />
            <button type="button" disabled={busy} onclick={() => cameraInput?.click()}>
                <Icon name="camera" /> {t('photo.take')}
            </button>
        </form>

        <hr />

        <form method="POST" action="?/photoAdd" use:enhance={handleAdd}>
            <label>
                {t('photo.choose')}
                <input type="file" accept="image/*" bind:this={fileInput} disabled={busy} />
            </label>
            <label>
                {t('photo.captionOptional')}
                <input type="text" name="caption" maxlength="200" disabled={busy} />
            </label>
            <button type="submit" class="secondary" aria-busy={busy} disabled={busy}>
                {busy ? t('photo.uploading') : t('photo.upload')}
            </button>
        </form>

        {#if busy}
            <progress value={progress} max="100" aria-label={t('photo.progressLabel')}></progress>
        {/if}
        {#if errorMessage}
            <p class="error" role="alert">{errorMessage}</p>
        {/if}
    </article>

    {#if photos.length === 0}
        <article class="empty">
            <p class="muted">{t('photo.empty')}</p>
        </article>
    {:else}
        <ul class="gallery">
            {#each photos as photo (photo.id)}
                <li class="tile">
                    <a href={photo.url} target="_blank" rel="noreferrer">
                        <img src={photo.thumbUrl} alt={photo.caption ?? t('photo.altDefault')} loading="lazy" />
                        {#if photo.isAvatar}<span class="badge"
                                ><Icon name="star-fill" size={12} /> {t('photo.avatarBadge')}</span
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
                                    ><Icon name="star-fill" size={12} /> {t('photo.makeAvatar')}</button
                                >
                            </form>
                        {/if}
                        <form method="POST" action="?/photoDelete" use:enhance={confirmDelete}>
                            <input type="hidden" name="photoId" value={photo.id} />
                            <button
                                type="submit"
                                class="outline secondary small icon-btn"
                                aria-label={t('photo.delete')}
                                title={t('photo.delete')}><Icon name="trash" /></button
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