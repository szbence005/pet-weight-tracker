<script lang="ts">
	import { enhance } from '$app/forms';
	import { SPECIES } from '#lib/pet-form.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const failed = $derived(form?.success === false ? form : null);
	const today = new Date().toISOString().slice(0, 10);
	const values = $derived(
		failed?.values ?? {
			name: data.pet.name,
			species: data.pet.species,
			breed: data.pet.breed ?? '',
			birthDate: data.pet.birthDate ?? '',
			notes: data.pet.notes ?? ''
		}
	);
</script>

<svelte:head>
	<title>{data.pet.name}</title>
</svelte:head>

<p><a href="/pets">← Vissza a kedvencekhez</a></p>

<h1>{data.pet.name}</h1>

<form
	method="post"
	action="?/update"
	use:enhance={() =>
		async ({ update }) => {
			await update({ reset: false });
		}}
>
	<label>
		Név
		<input
			name="name"
			maxlength="60"
			value={values.name}
			aria-invalid={failed?.errors.name ? 'true' : undefined}
			required
		/>
		{#if failed?.errors.name}<small class="error">{failed.errors.name}</small>{/if}
	</label>

	<label>
		Faj
		<select name="species" aria-invalid={failed?.errors.species ? 'true' : undefined} required>
			{#each SPECIES as species (species)}
				<option value={species} selected={values.species === species}>{species}</option>
			{/each}
		</select>
		{#if failed?.errors.species}<small class="error">{failed.errors.species}</small>{/if}
	</label>

	<label>
		Fajta (nem kötelező)
		<input
			name="breed"
			maxlength="60"
			value={values.breed}
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
			value={values.birthDate}
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
			aria-invalid={failed?.errors.notes ? 'true' : undefined}>{values.notes}</textarea
		>
		{#if failed?.errors.notes}<small class="error">{failed.errors.notes}</small>{/if}
	</label>

	{#if form?.success}
		<p role="status">Mentve.</p>
	{/if}

	<button type="submit">Mentés</button>
</form>

<hr />

<details>
	<!-- svelte-ignore a11y_no_redundant_roles -->
	<summary role="button" class="secondary outline">Kedvenc törlése</summary>
	<p>
		Biztosan törlöd: <strong>{data.pet.name}</strong>? Ez nem vonható vissza, és a hozzá tartozó
		adatok is törlődnek.
	</p>
	<form method="post" action="?/delete" use:enhance>
		<button type="submit" class="contrast">Igen, törlöm</button>
	</form>
</details>

<style>
	.error {
		color: var(--pico-del-color);
	}
</style>
