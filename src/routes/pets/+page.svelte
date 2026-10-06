<script lang="ts">
	import { enhance } from '$app/forms';
	import { SPECIES } from '#lib/pet-form.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const failed = $derived(form?.success === false ? form : null);
	const today = new Date().toISOString().slice(0, 10);
</script>

<svelte:head>
	<title>Kedvenceim</title>
</svelte:head>

<h1>Kedvenceim</h1>

{#if data.pets.length === 0}
	<p>Még nincs kedvenced. Add hozzá az elsőt az alábbi űrlappal.</p>
{:else}
	<div class="grid">
		{#each data.pets as pet (pet.id)}
			<article>
				{#if data.avatars[pet.id]}
					<img class="avatar" src={data.avatars[pet.id]} alt="{pet.name} fotója" loading="lazy" />
				{/if}
				<h3><a href="/pets/{pet.id}">{pet.name}</a></h3>
				<p>
					{pet.species}{#if pet.breed}&nbsp;· {pet.breed}{/if}
				</p>
				{#if pet.birthDate}
					<small>Született: {pet.birthDate}</small>
				{/if}
			</article>
		{/each}
	</div>
{/if}

<details open={data.pets.length === 0 || failed !== null}>
	<!-- svelte-ignore a11y_no_redundant_roles -->
	<summary role="button" class="secondary">Új kedvenc hozzáadása</summary>

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
			<select name="species" aria-invalid={failed?.errors.species ? 'true' : undefined} required>
				<option value="" disabled selected={!failed?.values.species}>Válassz…</option>
				{#each SPECIES as species (species)}
					<option value={species} selected={failed?.values.species === species}>{species}</option>
				{/each}
			</select>
			{#if failed?.errors.species}<small class="error">{failed.errors.species}</small>{/if}
		</label>

		<label>
			Fajta (nem kötelező)
			<input
				name="breed"
				maxlength="60"
				value={failed?.values.breed ?? ''}
				aria-invalid={failed?.errors.breed ? 'true' : undefined}
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
	.avatar {
		width: 4rem;
		height: 4rem;
		object-fit: cover;
		border-radius: 50%;
	}

	.error {
		color: var(--pico-del-color);
	}
</style>
