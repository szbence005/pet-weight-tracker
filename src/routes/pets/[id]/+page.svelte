<script lang="ts">
	import { enhance } from '$app/forms';
	import Chart from 'chart.js/auto';
	import { SPECIES } from '#lib/pet-form.ts';
	import PhotoGallery from '#lib/components/PhotoGallery.svelte';
	import { formatWeight, gramsToKg, type WeightUnit } from '#lib/units.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const failed = $derived(form?.success === false ? form : null);
	const saved = $derived(form?.success === true);
	const weightFailed = $derived(form?.weightFailed === true ? form : null);
	// After a failed save show what the user typed; otherwise the stored values.
	const values = $derived(failed?.values ?? data.pet);
	const today = new Date().toISOString().slice(0, 10);

	let unit = $state<WeightUnit>('kg');
	let canvas = $state<HTMLCanvasElement>();

	// Newest first in the table; the chart uses the oldest-first order from the server.
	const newestFirst = $derived([...data.weights].reverse());

	// Chart.js only runs in the browser ($effect does not run on the server).
	$effect(() => {
		if (!canvas) return;
		const chart = new Chart(canvas, {
			type: 'line',
			data: {
				labels: data.weights.map((w) => w.measuredAt),
				datasets: [
					{
						label: unit,
						data: data.weights.map((w) =>
							unit === 'kg' ? gramsToKg(w.weightGrams) : w.weightGrams
						),
						tension: 0.2
					}
				]
			},
			options: {
				plugins: { legend: { display: false } },
				scales: { y: { title: { display: true, text: unit } } }
			}
		});
		return () => chart.destroy();
	});
</script>

<svelte:head>
	<title>{data.pet.name}</title>
</svelte:head>

<p><a href="/pets">&larr; Vissza a kedvencekhez</a></p>
<h1>{data.pet.name}</h1>

<h2>Súly</h2>

<div role="group">
	<button type="button" class:outline={unit !== 'kg'} onclick={() => (unit = 'kg')}>kg</button>
	<button type="button" class:outline={unit !== 'g'} onclick={() => (unit = 'g')}>g</button>
</div>

{#if data.weights.length === 0}
	<p>Még nincs mérés. Add hozzá az elsőt az alábbi űrlappal.</p>
{:else}
	<canvas bind:this={canvas}></canvas>

	<table>
		<thead>
			<tr><th>Dátum</th><th>Súly</th><th>Megjegyzés</th><th></th></tr>
		</thead>
		<tbody>
			{#each newestFirst as entry (entry.id)}
				<tr>
					<td>{entry.measuredAt}</td>
					<td>{formatWeight(entry.weightGrams, unit)}</td>
					<td>{entry.note ?? ''}</td>
					<td>
						<form
							method="post"
							action="?/weightDelete"
							use:enhance={({ cancel }) => {
								if (!confirm('Biztosan törlöd ezt a mérést?')) cancel();
							}}
						>
							<input type="hidden" name="entryId" value={entry.id} />
							<button type="submit" class="secondary outline">Törlés</button>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<details open={data.weights.length === 0 || weightFailed !== null}>
	<!-- svelte-ignore a11y_no_redundant_roles -->
	<summary role="button" class="secondary">Új mérés hozzáadása</summary>

	<form method="post" action="?/weightAdd" use:enhance>
		<input type="hidden" name="unit" value={unit} />

		<label>
			Súly ({unit})
			<input
				name="weight"
				inputmode="decimal"
				value={weightFailed?.weightValues.weight ?? ''}
				aria-invalid={weightFailed?.weightErrors.weight ? 'true' : undefined}
				required
			/>
			{#if weightFailed?.weightErrors.weight}
				<small class="error">{weightFailed.weightErrors.weight}</small>
			{/if}
		</label>

		<label>
			Dátum
			<input
				type="date"
				name="measuredAt"
				max={today}
				value={weightFailed?.weightValues.measuredAt ?? today}
				aria-invalid={weightFailed?.weightErrors.measuredAt ? 'true' : undefined}
				required
			/>
			{#if weightFailed?.weightErrors.measuredAt}
				<small class="error">{weightFailed.weightErrors.measuredAt}</small>
			{/if}
		</label>

		<label>
			Megjegyzés (nem kötelező)
			<input
				name="note"
				maxlength="200"
				value={weightFailed?.weightValues.note ?? ''}
				aria-invalid={weightFailed?.weightErrors.note ? 'true' : undefined}
			/>
			{#if weightFailed?.weightErrors.note}
				<small class="error">{weightFailed.weightErrors.note}</small>
			{/if}
		</label>

		<button type="submit">Mérés mentése</button>
	</form>
</details>

<hr />

<PhotoGallery petId={data.pet.id} photos={data.photos} />

<h2>Adatok</h2>

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
