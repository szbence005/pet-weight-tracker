<script lang="ts">
	import { enhance } from '$app/forms';
	import Chart from 'chart.js/auto';
	import { SPECIES, speciesLabel } from '#lib/pet-form.ts';
	import PhotoGallery from '#lib/components/PhotoGallery.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import BreedInput from '#lib/components/BreedInput.svelte';
	import { addDays, daysBetween, forecastGrowth } from '#lib/forecast.ts';
	import { useT } from '#lib/i18n/context.ts';
	import { formatDate } from '#lib/i18n/format.ts';
	import type { MessageKey } from '#lib/i18n/index.ts';
	import type { IconName } from '#lib/icons.ts';
	import { formatWeight, gramsToKg, type WeightUnit } from '#lib/units.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const t = useT();

	type Tab = 'weights' | 'photos' | 'edit';
	const tabs: { id: Tab; key: MessageKey; icon: IconName }[] = [
		{ id: 'weights', key: 'tab.weights', icon: 'pulse' },
		{ id: 'photos', key: 'tab.photos', icon: 'image' },
		{ id: 'edit', key: 'tab.edit', icon: 'pencil' }
	];
	const horizons: { days: number; key: MessageKey }[] = [
		{ days: 90, key: 'forecast.horizon.90' },
		{ days: 180, key: 'forecast.horizon.180' },
		{ days: 365, key: 'forecast.horizon.365' }
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
	const horizonLabel = $derived(
		t(horizons.find((h) => h.days === horizon)?.key ?? 'forecast.horizon.180')
	);

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
		const dayLabel = (day: number) => formatDate(addDays(origin, day), data.locale);

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
				label: t('chart.measured'),
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
						dashed(t('chart.optimistic'), 'optimistic', color('--gh-success'), forecast.points),
						dashed(t('chart.realistic'), 'realistic', muted, forecast.points),
						dashed(t('chart.pessimistic'), 'pessimistic', color('--gh-danger'), forecast.points)
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
						callbacks: { title: (items) => dayLabel(items[0]?.parsed.x ?? 0) }
					}
				},
				scales: {
					x: {
						type: 'linear',
						ticks: {
							color: muted,
							maxTicksLimit: 6,
							callback: (value) => dayLabel(Number(value))
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

<p><a href="/pets">&larr; {t('pet.back')}</a></p>

<div class="pet-head">
	<h1>{data.pet.name}</h1>
	<p class="muted">
		{speciesLabel(data.pet.species, t)}{data.pet.breed ? ` \u00b7 ${data.pet.breed}` : ''}
	</p>
</div>

<div class="tabs" role="tablist" aria-label={t('pet.tabsLabel')}>
	{#each tabs as tabItem (tabItem.id)}
		<button
			type="button"
			role="tab"
			id="tab-{tabItem.id}"
			aria-selected={tab === tabItem.id}
			aria-controls="panel"
			onclick={() => (tab = tabItem.id)}><Icon name={tabItem.icon} /> {t(tabItem.key)}</button
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
				<p class="muted">{t('weight.empty')}</p>
			</article>
		{:else}
			<div class="chart-controls">
				<label>
					<input type="checkbox" bind:checked={showForecast} />
					{t('forecast.toggle')}
				</label>
				{#if showForecast}
					<select bind:value={horizon} aria-label={t('forecast.horizonLabel')}>
						{#each horizons as h (h.days)}
							<option value={h.days}>{t(h.key)}</option>
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
							{t('forecast.summary', {
								horizon: horizonLabel,
								date: formatDate(end.date, data.locale),
								realistic: formatWeight(end.realistic, unit, data.locale),
								optimistic: formatWeight(end.optimistic, unit, data.locale),
								pessimistic: formatWeight(end.pessimistic, unit, data.locale)
							})}
							{t('forecast.disclaimer')}
						</small>
					</p>
				{:else}
					<p class="muted">
						<small>{t('forecast.tooFew')}</small>
					</p>
				{/if}
			{/if}

			<div class="overflow-auto">
				<table>
					<thead>
						<tr>
							<th>{t('weight.col.date')}</th>
							<th>{t('weight.col.weight')}</th>
							<th>{t('weight.col.note')}</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each newestFirst as entry (entry.id)}
							<tr>
								<td>{formatDate(entry.measuredAt, data.locale)}</td>
								<td>{formatWeight(entry.weightGrams, unit, data.locale)}</td>
								<td>{entry.note ?? ''}</td>
								<td>
									<form
										method="post"
										action="?/weightDelete"
										use:enhance={({ cancel }) => {
											if (!confirm(t('weight.deleteConfirm'))) cancel();
										}}
									>
										<input type="hidden" name="entryId" value={entry.id} />
										<button
											type="submit"
											class="secondary outline small icon-btn"
											aria-label={t('weight.delete')}
											title={t('weight.delete')}><Icon name="trash" /></button
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
			<summary role="button" class="secondary"><Icon name="plus" /> {t('weight.add')}</summary>

			<form method="post" action="?/weightAdd" use:enhance>
				<input type="hidden" name="unit" value={unit} />

				<label>
					{t('weight.field', { unit })}
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
					{t('weight.date')}
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
					{t('weight.noteOptional')}
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

				<button type="submit">{t('weight.save')}</button>
			</form>
		</details>
	{:else if tab === 'photos'}
		<PhotoGallery petId={data.pet.id} photos={data.photos} />
	{:else}
		{#if saved}
			<p role="status"><ins>{t('pet.saved')}</ins></p>
		{/if}

		<form method="post" action="?/update" use:enhance>
			<label>
				{t('pet.name')}
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
				{t('pet.species')}
				<select
					name="species"
					aria-invalid={failed?.errors.species ? 'true' : undefined}
					onchange={(event) => (picked = event.currentTarget.value)}
					required
				>
					{#each SPECIES as species (species)}
						<option value={species} selected={values.species === species}
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
					value={values.breed ?? ''}
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
					value={values.birthDate ?? ''}
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
					aria-invalid={failed?.errors.notes ? 'true' : undefined}>{values.notes ?? ''}</textarea
				>
				{#if failed?.errors.notes}<small class="error">{failed.errors.notes}</small>{/if}
			</label>

			<button type="submit">{t('pet.save')}</button>
		</form>

		<div class="danger-zone">
			<h3><Icon name="alert" /> {t('pet.danger.title')}</h3>
			<p class="muted">{t('pet.danger.text')}</p>
			<!-- Plain POST (no use:enhance): the server redirects to /pets afterwards. -->
			<form
				method="post"
				action="?/delete"
				onsubmit={(event) => {
					if (!confirm(t('pet.danger.confirm', { name: data.pet.name }))) {
						event.preventDefault();
					}
				}}
			>
				<button type="submit" class="danger outline"
					><Icon name="trash" /> {t('pet.danger.button')}</button
				>
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
