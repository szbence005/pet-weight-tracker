<script lang="ts">
	import { enhance } from '$app/forms';
	import Chart from 'chart.js/auto';
	import { SPECIES } from '#lib/pet-form.ts';
	import PhotoGallery from '#lib/components/PhotoGallery.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import BreedInput from '#lib/components/BreedInput.svelte';
	import { addDays, daysBetween, forecastGrowth } from '#lib/forecast.ts';
	import type { IconName } from '#lib/icons.ts';
	import { formatWeight, gramsToKg, type WeightUnit } from '#lib/units.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	type Tab = 'weights' | 'photos' | 'edit';
	const tabs: { id: Tab; label: string; icon: IconName }[] = [
		{ id: 'weights', label: 'Súly', icon: 'pulse' },
		{ id: 'photos', label: 'Fotók', icon: 'image' },
		{ id: 'edit', label: 'Szerkesztés', icon: 'pencil' }
	];
	const horizons = [
		{ days: 90, label: '3 hónap' },
		{ days: 180, label: '6 hónap' },
		{ days: 365, label: '1 év' }
	];

	const failed = $derived(form?.success === false ? form : null);
	const saved = $derived(form?.success === true);
	const weightFailed = $derived(form?.weightFailed === true ? form : null);
	// After a failed save show what the user typed; otherwise the stored values.
	const values = $derived(failed?.values ?? data.pet);
	// The breed suggestions depend on the selected species.
	let picked = $state<string | null>(null);
	const currentSpecies = $derived(picked ?? values.species ?? '');
	const today = new Date().toISOString().slice(0, 10);

	let tab = $state<Tab>('weights');
	let unit = $state<WeightUnit>('kg');
	let canvas = $state<HTMLCanvasElement>();
	let showForecast = $state(true);
	let horizon = $state(180);

	// A failed form submit switches to the tab that holds that form.
	$effect(() => {
		if (failed) tab = 'edit';
		else if (weightFailed) tab = 'weights';
	});

	// Newest first in the table; the chart uses the oldest-first order from the server.
	const newestFirst = $derived([...data.weights].reverse());
	const forecast = $derived(forecastGrowth(data.weights, horizon));
	const horizonLabel = $derived(horizons.find((h) => h.days === horizon)?.label ?? '');

	// Chart.js only runs in the browser ($effect does not run on the server).
	// x axis = days since the first measurement (linear), ticks are shown as dates, so the
	// forecast points are spaced correctly in time.
	$effect(() => {
		if (!canvas || data.weights.length === 0) return;
		const origin = data.weights[0].measuredAt;
		const css = getComputedStyle(document.documentElement);
		const color = (name: string) => css.getPropertyValue(name).trim();
		const line = color('--pico-primary');
		const muted = color('--pico-muted-color');
		const grid = color('--pico-muted-border-color');
		const toValue = (grams: number) => (unit === 'kg' ? gramsToKg(grams) : grams);

		const last = data.weights[data.weights.length - 1];
		const lastPoint = { x: daysBetween(origin, last.measuredAt), y: toValue(last.weightGrams) };

		const dashed = (
			label: string,
			key: 'realistic' | 'optimistic' | 'pessimistic',
			c: string,
			points: NonNullable<typeof forecast>['points']
		) => ({
			label,
			data: [
				lastPoint,
				...points.map((p) => ({ x: daysBetween(origin, p.date), y: toValue(p[key]) }))
			],
			borderColor: c,
			backgroundColor: c,
			borderDash: [6, 4],
			borderWidth: 2,
			pointRadius: 0,
			tension: 0
		});

		const datasets = [
			{
				label: 'Mért',
				data: data.weights.map((w) => ({
					x: daysBetween(origin, w.measuredAt),
					y: toValue(w.weightGrams)
				})),
				tension: 0.2,
				borderColor: line,
				backgroundColor: line,
				pointRadius: 3
			},
			...(showForecast && forecast
				? [
						dashed('Optimista', 'optimistic', color('--gh-success'), forecast.points),
						dashed('Reális', 'realistic', muted, forecast.points),
						dashed('Pesszimista', 'pessimistic', color('--gh-danger'), forecast.points)
					]
				: [])
		];

		const chart = new Chart(canvas, {
			type: 'line',
			data: { datasets },
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: datasets.length > 1, labels: { color: muted } },
					tooltip: {
						callbacks: { title: (items) => addDays(origin, items[0]?.parsed.x ?? 0) }
					}
				},
				scales: {
					x: {
						type: 'linear',
						ticks: {
							color: muted,
							maxTicksLimit: 6,
							callback: (value) => addDays(origin, Number(value))
						},
						grid: { color: grid }
					},
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
			onclick={() => (tab = t.id)}><Icon name={t.icon} /> {t.label}</button
		>
	{/each}
</div>

<div role="tabpanel" id="panel" aria-labelledby="tab-{tab}">
	{#if tab === 'weights'}
		<div role="group" class="unit-toggle">
			<button type="button" class:outline={unit !== 'kg'} onclick={() => (unit = 'kg')}>kg</button>
			<button type="button" class:outline={unit !== 'g'} onclick={() => (unit = 'g')}>g</button>
		</div>

		{#if data.weights.length === 0}
			<article class="empty">
				<p class="muted">Még nincs mérés. Add hozzá az elsőt az alábbi űrlappal.</p>
			</article>
		{:else}
			<div class="chart-controls">
				<label>
					<input type="checkbox" bind:checked={showForecast} />
					Előrejelzés
				</label>
				{#if showForecast}
					<select bind:value={horizon} aria-label="Előrejelzés időtávja">
						{#each horizons as h (h.days)}
							<option value={h.days}>{h.label}</option>
						{/each}
					</select>
				{/if}
			</div>

			<div class="chart-box"><canvas bind:this={canvas}></canvas></div>

			{#if showForecast}
				{#if forecast}
					{@const end = forecast.points[forecast.points.length - 1]}
					<p class="muted">
						<small>
							{horizonLabel} múlva ({end.date}): reális {formatWeight(end.realistic, unit)},
							optimista {formatWeight(end.optimistic, unit)}, pesszimista
							{formatWeight(end.pessimistic, unit)}. Az utolsó legfeljebb 10 mérésre illesztett
							egyenes alapján számolt, tájékoztató becslés: a teknősök növekedése idővel lassul,
							ezért a hosszabb táv pontatlanabb.
						</small>
					</p>
				{:else}
					<p class="muted">
						<small>Az előrejelzéshez legalább 3 mérés kell, legalább 2 hét különbséggel.</small>
					</p>
				{/if}
			{/if}

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
										<button
											type="submit"
											class="secondary outline small icon-btn"
											aria-label="Mérés törlése"
											title="Mérés törlése"><Icon name="trash" /></button
										>
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
			<summary role="button" class="secondary"><Icon name="plus" /> Új mérés hozzáadása</summary>

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
				<select
					name="species"
					aria-invalid={failed?.errors.species ? 'true' : undefined}
					onchange={(event) => (picked = event.currentTarget.value)}
					required
				>
					{#each SPECIES as species (species)}
						<option value={species} selected={values.species === species}>{species}</option>
					{/each}
				</select>
				{#if failed?.errors.species}<small class="error">{failed.errors.species}</small>{/if}
			</label>

			<label>
				Fajta (nem kötelező)
				<BreedInput
					species={currentSpecies}
					value={values.breed ?? ''}
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
			<h3><Icon name="alert" /> Veszélyes zóna</h3>
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
				<button type="submit" class="danger outline"><Icon name="trash" /> Kedvenc törlése</button>
			</form>
		</div>
	{/if}
</div>

<style>
	/* Pico makes button groups full width; the kg/g switch should only be as wide as needed. */
	.unit-toggle {
		width: auto;
	}
</style>
