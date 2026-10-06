<script lang="ts">
	import { enhance } from '$app/forms';
	import Chart from 'chart.js/auto';
	import { SPECIES } from '#lib/pet-form.ts';
	import PhotoGallery from '#lib/components/PhotoGallery.svelte';
	import { formatWeight, gramsToKg, type WeightUnit } from '#lib/units.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	type Tab = 'weights' | 'photos' | 'edit';
	const tabs: { id: Tab; label: string }[] = [
		{ id: 'weights', label: 'Súly' },
		{ id: 'photos', label: 'Fotók' },
		{ id: 'edit', label: 'Szerkesztés' }
	];

	const failed = $derived(form?.success === false ? form : null);
	const saved = $derived(form?.success === true);
	const weightFailed = $derived(form?.weightFailed === true ? form : null);
	// After a failed save show what the user typed; otherwise the stored values.
	const values = $derived(failed?.values ?? data.pet);
	const today = new Date().toISOString().slice(0, 10);

	let tab = $state<Tab>('weights');
	let unit = $state<WeightUnit>('kg');
	let canvas = $state<HTMLCanvasElement>();

	// A failed form submit switches to the tab that holds that form.
	$effect(() => {
		if (failed) tab = 'edit';
		else if (weightFailed) tab = 'weights';
	});

	// Newest first in the table; the chart uses the oldest-first order from the server.
	const newestFirst = $derived([...data.weights].reverse());

	// Chart.js only runs in the browser ($effect does not run on the server).
	$effect(() => {
		if (!canvas) return;
		const css = getComputedStyle(document.documentElement);
		const line = css.getPropertyValue('--pico-primary').trim();
		const muted = css.getPropertyValue('--pico-muted-color').trim();
		const grid = css.getPropertyValue('--pico-muted-border-color').trim();
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
						tension: 0.2,
						borderColor: line,
						backgroundColor: line,
						pointRadius: 3
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: { legend: { display: false } },
				scales: {
					x: { ticks: { color: muted }, grid: { color: grid } },
					y: {
						ticks: { color: muted },
						grid: { color: grid },
						title: { display: true, text: unit, color: muted }
					}
				}
			}
		});
		return () => chart.destroy();
	});
</script>

<svelte:head>
	<title>{data.pet.name}</title>
</svelte:head>

<p><a href="/pets">&larr; Vissza a kedvencekhez</a></p>

<div class="pet-head">
	<h1>{data.pet.name}</h1>
	<p class="muted">{data.pet.species}{data.pet.breed ? ` · ${data.pet.breed}` : ''}</p>
</div>

<div class="tabs" role="tablist" aria-label="Kedvenc adatai">
	{#each tabs as t (t.id)}
		<button
			type="button"
			role="tab"
			id="tab-{t.id}"
			aria-selected={tab === t.id}
			aria-controls="panel"
			onclick={() => (tab = t.id)}>{t.label}</button
		>
	{/each}
</div>

<div role="tabpanel" id="panel" aria-labelledby="tab-{tab}">
	{#if tab === 'weights'}
		<div role="group">
			<button type="button" class:outline={unit !== 'kg'} onclick={() => (unit = 'kg')}>kg</button>
			<button type="button" class:outline={unit !== 'g'} onclick={() => (unit = 'g')}>g</button>
		</div>

		{#if data.weights.length === 0}
			<article class="empty">
				<p class="muted">Még nincs mérés. Add hozzá az elsőt az alábbi űrlappal.</p>
			</article>
		{:else}
			<div class="chart-box"><canvas bind:this={canvas}></canvas></div>

			<div class="overflow-auto">
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
										<button type="submit" class="secondary outline small">Törlés</button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
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
	{:else if tab === 'photos'}
		<PhotoGallery petId={data.pet.id} photos={data.photos} />
	{:else}
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

		<div class="danger-zone">
			<h3>Veszélyes zóna</h3>
			<p class="muted">
				A kedvenc törlésével az összes mérése és fotója is törlődik. Ez nem vonható vissza.
			</p>
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
				<button type="submit" class="danger outline">Kedvenc törlése</button>
			</form>
		</div>
	{/if}
</div>
