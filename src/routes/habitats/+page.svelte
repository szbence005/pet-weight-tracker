<script lang="ts">
    import { enhance } from '$app/forms';
    import Icon from '#lib/components/Icon.svelte';
    import { useT } from '#lib/i18n/context.ts';
    import { HABITAT_KINDS, kindLabel } from '#lib/habitat-form.ts';
    import type { PageProps } from './$types';

    let { data, form }: PageProps = $props();
    const t = useT();

    const failed = $derived(form?.success === false ? form : null);
</script>

<svelte:head>
    <title>{t('nav.habitats')}</title>
</svelte:head>

<h1>{t('nav.habitats')}</h1>
<p class="muted">{t('habitats.intro')}</p>

{#if data.habitats.length === 0}
    <article class="empty">
        <p class="muted">{t('habitats.empty')}</p>
    </article>
{:else}
    <div class="card-grid">
        {#each data.habitats as habitat (habitat.id)}
            <article class="habitat-card">
                <h3><a href="/habitats/{habitat.id}">{habitat.name}</a></h3>
                <p class="muted">{kindLabel(habitat.kind, t)}</p>
                {#if habitat.pets.length === 0}
                    <small class="muted">{t('habitat.nobody')}</small>
                {:else}
                    <ul class="chips">
                        {#each habitat.pets as pet (pet.id)}
                            <li><a href="/pets/{pet.id}">{pet.name}</a></li>
                        {/each}
                    </ul>
                {/if}
            </article>
        {/each}
    </div>
{/if}

<details open={data.habitats.length === 0 || failed !== null}>
    <!-- svelte-ignore a11y_no_redundant_roles -->
    <summary role="button" class="secondary"><Icon name="plus" /> {t('habitats.add')}</summary>

    <form method="post" action="?/create" use:enhance>
        <label>
            {t('habitat.name')}
            <input
                name="name"
                maxlength="60"
                value={failed?.values.name ?? ''}
                aria-invalid={failed?.errors.name ? 'true' : undefined}
                required
            />
            {#if failed?.errors.name}<small class="error">{failed.errors.name}</small>{/if}
        </label>

        <label>
            {t('habitat.kind')}
            <select name="kind" aria-invalid={failed?.errors.kind ? 'true' : undefined} required>
                <option value="" disabled selected={!failed?.values.kind}>{t('pet.choose')}</option>
                {#each HABITAT_KINDS as kind (kind)}
                    <option value={kind} selected={failed?.values.kind === kind}
                        >{kindLabel(kind, t)}</option
                    >
                {/each}
            </select>
            {#if failed?.errors.kind}<small class="error">{failed.errors.kind}</small>{/if}
        </label>

        <label>
            {t('pet.notesOptional')}
            <textarea
                name="notes"
                maxlength="500"
                rows="3"
                aria-invalid={failed?.errors.notes ? 'true' : undefined}
                >{failed?.values.notes ?? ''}</textarea
            >
            {#if failed?.errors.notes}<small class="error">{failed.errors.notes}</small>{/if}
        </label>

        <button type="submit">{t('pet.save')}</button>
    </form>
</details>

<style>
    .habitat-card {
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .habitat-card h3,
    .habitat-card p {
        margin: 0;
    }

    .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin: 0.4rem 0 0;
        padding: 0;
        list-style: none;
    }

    .chips li {
        margin: 0;
        padding: 0.1rem 0.6rem;
        border: 1px solid var(--gh-border);
        border-radius: 2rem;
        background: var(--gh-subtle);
        font-size: 0.85rem;
    }
</style>