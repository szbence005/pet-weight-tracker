<script lang="ts">
	import { enhance } from '$app/forms';
	import { SPECIES } from '#lib/pet-form.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const failed = $derived(form?.success === false ? form : null);
	const saved = $derived(form?.success === true);
	// After a failed save show what the user typed; otherwise the stored values.
	const values = $derived(failed?.values ?? data.pet);
	const today = new Date().toISOString().slice(0, 10);
</script>

<svelte:head>
	<title>{data.pet.name}</title>
</svelte:head>

<p><a href="/pets">&larr; Vissza a kedvencekhez</a></p>
<h1>{data.pet.name}</h1>

{#if saved}
	<p role="status"><ins>Mentve.</ins></p>
{/if}

<form method="post" action="?/update" use:enhance>
	<label>
		Név
		<input
			name="name"
			maxlength="60"
			value={values.name ?? ''}
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
			value={values.breed ?? ''}
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
			value={values.birthDate ?? ''}
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
			aria-invalid={failed?.errors.notes ? 'true' : undefined}>{values.notes ?? ''}</textarea
		>
		{#if failed?.errors.notes}<small class="error">{failed.errors.notes}</small>{/if}
	</label>

	<button type="submit">Mentés</button>
</form>

<hr />

<!-- Plain POST (no use:enhance): the server redirects to /pets afterwards. -->
<form
	method="post"
	action="?/delete"
	onsubmit={(event) => {
		if (!confirm(`Biztosan törlöd: ${data.pet.name}? Ez nem vonható vissza.`)) {
			event.preventDefault();
		}
	}}
>
	<button type="submit" class="secondary outline">Kedvenc törlése</button>
</form>

<style>
	.error {
		color: var(--pico-del-color);
	}
</style>
