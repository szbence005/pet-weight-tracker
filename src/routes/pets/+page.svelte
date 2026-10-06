<script lang="ts">
	import { enhance } from '$app/forms';
	import { SPECIES, speciesLabel } from '#lib/pet-form.ts';
	import { ageText } from '#lib/age.ts';
	import { formatDate } from '#lib/i18n/format.ts';
	import { useT } from '#lib/i18n/context.ts';
	import Icon from '#lib/components/Icon.svelte';
	import BreedInput from '#lib/components/BreedInput.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const t = useT();

	const failed = $derived(form?.success === false ? form : null);
	// The breed suggestions depend on the selected species.
	let picked = $state<string | null>(null);
	const currentSpecies = $derived(picked ?? failed?.values.species ?? '');
	const today = new Date().toISOString().slice(0, 10);
</script>

<svelte:head>
	<title>{t('pets.title')}</title>
</svelte:head>

<h1>{t('pets.title')}</h1>

{#if data.pets.length === 0}
	<article class="empty">
		<p class="muted">{t('pets.empty')}</p>
	</article>
{:else}
	<div class="card-grid">
		{#each data.pets as pet (pet.id)}
			<article class="pet-card">
				{#if data.avatars[pet.id]}
					<img
						class="avatar"
						src={data.avatars[pet.id]}
						alt={t('pet.photoAlt', { name: pet.name })}
						loading="lazy"
					/>
				{:else}
					<div class="avatar placeholder" aria-hidden="true">
						{pet.name.slice(0, 1).toUpperCase()}
					</div>
				{/if}
				<h3><a href="/pets/{pet.id}">{pet.name}</a></h3>
				<p class="muted">
					{speciesLabel(pet.species, t)}{#if pet.breed}&nbsp;&middot; {pet.breed}{/if}
				</p>
				{#if pet.birthDate}
					<small class="muted"
						>{ageText(pet.birthDate, t)} &middot; {t('pet.born', {
							date: formatDate(pet.birthDate, data.locale)
						})}</small
					>
				{/if}
			</article>
		{/each}
	</div>
{/if}

<details open={data.pets.length === 0 || failed !== null}>
	<!-- svelte-ignore a11y_no_redundant_roles -->
	<summary role="button" class="secondary"><Icon name="plus" /> {t('pets.add')}</summary>

	<form method="post" action="?/create" use:enhance>
		<label>
			{t('pet.name')}
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
			{t('pet.species')}
			<select
				name="species"
				aria-invalid={failed?.errors.species ? 'true' : undefined}
				onchange={(event) => (picked = event.currentTarget.value)}
				required
			>
				<option value="" disabled selected={!failed?.values.species}>{t('pet.choose')}</option>
				{#each SPECIES as species (species)}
					<option value={species} selected={failed?.values.species === species}
						>{speciesLabel(species, t)}</option
					>
				{/each}
			</select>
			{#if failed?.errors.species}<small class="error">{failed.errors.species}</small>{/if}
		</label>

		<label>
			{t('pet.breedOptional')}
			<BreedInput
				species={currentSpecies}
				value={failed?.values.breed ?? ''}
				invalid={!!failed?.errors.breed}
			/>
			{#if failed?.errors.breed}<small class="error">{failed.errors.breed}</small>{/if}
		</label>

		<label>
			{t('pet.birthDateOptional')}
			<input
				type="date"
				name="birthDate"
				max={today}
				value={failed?.values.birthDate ?? ''}
				aria-invalid={failed?.errors.birthDate ? 'true' : undefined}
			/>
			{#if failed?.errors.birthDate}<small class="error">{failed.errors.birthDate}</small>{/if}
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
	.pet-card {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.pet-card h3,
	.pet-card p {
		margin: 0;
	}

	.placeholder {
		display: grid;
		place-items: center;
		background: var(--gh-subtle);
		border: 1px solid var(--gh-border);
		color: var(--gh-muted);
		font-size: 1.5rem;
		font-weight: 600;
	}
</style>
