<script lang="ts">
	import { enhance } from '$app/forms';
	import { SPECIES } from '#lib/pet-form.ts';
	import Icon from '#lib/components/Icon.svelte';
	import BreedInput from '#lib/components/BreedInput.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const failed = $derived(form?.success === false ? form : null);
	// The breed suggestions depend on the selected species.
	let picked = $state<string | null>(null);
	const currentSpecies = $derived(picked ?? failed?.values.species ?? '');
	const today = new Date().toISOString().slice(0, 10);

	// Rough age text from a YYYY-MM-DD birth date.
	function ageText(birthDate: string): string {
		const born = new Date(birthDate);
		const now = new Date();
		let months = (now.getFullYear() - born.getFullYear()) * 12 + now.getMonth() - born.getMonth();
		if (now.getDate() < born.getDate()) months--;
		if (months < 1) return '1 hónapnál fiatalabb';
		if (months < 12) return `${months} hónapos`;
		return `${Math.floor(months / 12)} éves`;
	}
</script>

<svelte:head>
	<title>Kedvenceim</title>
</svelte:head>

<h1>Kedvenceim</h1>

{#if data.pets.length === 0}
	<article class="empty">
		<p class="muted">Még nincs kedvenced. Add hozzá az elsőt az alábbi űrlappal.</p>
	</article>
{:else}
	<div class="card-grid">
		{#each data.pets as pet (pet.id)}
			<article class="pet-card">
				{#if data.avatars[pet.id]}
					<img class="avatar" src={data.avatars[pet.id]} alt="{pet.name} fotója" loading="lazy" />
				{:else}
					<div class="avatar placeholder" aria-hidden="true">
						{pet.name.slice(0, 1).toUpperCase()}
					</div>
				{/if}
				<h3><a href="/pets/{pet.id}">{pet.name}</a></h3>
				<p class="muted">
					{pet.species}{#if pet.breed}&nbsp;· {pet.breed}{/if}
				</p>
				{#if pet.birthDate}
					<small class="muted">{ageText(pet.birthDate)} · született: {pet.birthDate}</small>
				{/if}
			</article>
		{/each}
	</div>
{/if}

<details open={data.pets.length === 0 || failed !== null}>
	<!-- svelte-ignore a11y_no_redundant_roles -->
	<summary role="button" class="secondary"><Icon name="plus" /> Új kedvenc hozzáadása</summary>

	<form method="post" action="?/create" use:enhance>
		<label>
			Név
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
			Faj
			<select
				name="species"
				aria-invalid={failed?.errors.species ? 'true' : undefined}
				onchange={(event) => (picked = event.currentTarget.value)}
				required
			>
				<option value="" disabled selected={!failed?.values.species}>Válassz…</option>
				{#each SPECIES as species (species)}
					<option value={species} selected={failed?.values.species === species}>{species}</option>
				{/each}
			</select>
			{#if failed?.errors.species}<small class="error">{failed.errors.species}</small>{/if}
		</label>

		<label>
			Fajta (nem kötelező)
			<BreedInput
				species={currentSpecies}
				value={failed?.values.breed ?? ''}
				invalid={!!failed?.errors.breed}
			/>
			{#if failed?.errors.breed}<small class="error">{failed.errors.breed}</small>{/if}
		</label>

		<label>
			Születési dátum (nem kötelező)
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
			Megjegyzés (nem kötelező)
			<textarea
				name="notes"
				maxlength="500"
				rows="3"
				aria-invalid={failed?.errors.notes ? 'true' : undefined}
				>{failed?.values.notes ?? ''}</textarea
			>
			{#if failed?.errors.notes}<small class="error">{failed.errors.notes}</small>{/if}
		</label>

		<button type="submit">Mentés</button>
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
