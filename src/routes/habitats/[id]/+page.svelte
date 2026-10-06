<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '#lib/components/Icon.svelte';
	import { useT } from '#lib/i18n/context.ts';
	import { HABITAT_KINDS, kindLabel } from '#lib/habitat-form.ts';
	import { speciesLabel } from '#lib/pet-form.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const t = useT();

	const failed = $derived(form?.success === false ? form : null);
	const saved = $derived(form?.success === true);
	// After a failed save show what the user typed; otherwise the stored values.
	const values = $derived(failed?.values ?? data.habitat);
</script>

<svelte:head>
	<title>{data.habitat.name}</title>
</svelte:head>

<p><a href="/habitats">&larr; {t('habitat.back')}</a></p>

<div class="pet-head">
	<h1>{data.habitat.name}</h1>
	<p class="muted">
		{kindLabel(data.habitat.kind, t)}{data.habitat.notes ? ` \u00b7 ${data.habitat.notes}` : ''}
	</p>
</div>

<h2>{t('habitat.whoLives')}</h2>

{#if data.habitat.pets.length === 0}
	<article class="empty">
		<p class="muted">{t('habitat.nobody')}</p>
	</article>
{:else}
	<div class="overflow-auto">
		<table>
			<thead>
				<tr><th>{t('pet.name')}</th><th>{t('pet.species')}</th><th></th></tr>
			</thead>
			<tbody>
				{#each data.habitat.pets as pet (pet.id)}
					<tr>
						<td><a href="/pets/{pet.id}">{pet.name}</a></td>
						<td>{speciesLabel(pet.species, t)}</td>
						<td>
							<form method="post" action="?/removePet" use:enhance>
								<input type="hidden" name="petId" value={pet.id} />
								<button
									type="submit"
									class="secondary outline small icon-btn"
									aria-label={t('habitat.removePet')}
									title={t('habitat.removePet')}><Icon name="x" /></button
								>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

{#if data.candidates.length > 0}
	<form method="post" action="?/addPet" use:enhance>
		<label>
			{t('habitat.addPet')}
			<select name="petId" required>
				<option value="" disabled selected>{t('habitat.pickPet')}</option>
				{#each data.candidates as pet (pet.id)}
					<option value={pet.id}>{pet.name} ({speciesLabel(pet.species, t)})</option>
				{/each}
			</select>
		</label>
		<button type="submit"><Icon name="plus" /> {t('habitat.addButton')}</button>
	</form>
{:else}
	<p class="muted"><small>{t('habitat.noCandidates')}</small></p>
{/if}

<h2>{t('tab.edit')}</h2>

{#if saved}
	<p role="status"><ins>{t('pet.saved')}</ins></p>
{/if}

<form method="post" action="?/update" use:enhance>
	<label>
		{t('habitat.name')}
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
		{t('habitat.kind')}
		<select name="kind" aria-invalid={failed?.errors.kind ? 'true' : undefined} required>
			{#each HABITAT_KINDS as kind (kind)}
				<option value={kind} selected={values.kind === kind}>{kindLabel(kind, t)}</option>
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
			aria-invalid={failed?.errors.notes ? 'true' : undefined}>{values.notes ?? ''}</textarea
		>
		{#if failed?.errors.notes}<small class="error">{failed.errors.notes}</small>{/if}
	</label>

	<button type="submit">{t('pet.save')}</button>
</form>

<div class="danger-zone">
	<h3><Icon name="alert" /> {t('pet.danger.title')}</h3>
	<p class="muted">{t('habitat.danger.text')}</p>
	<!-- Plain POST (no use:enhance): the server redirects to /habitats afterwards. -->
	<form
		method="post"
		action="?/delete"
		onsubmit={(event) => {
			if (!confirm(t('pet.danger.confirm', { name: data.habitat.name }))) {
				event.preventDefault();
			}
		}}
	>
		<button type="submit" class="danger outline"
			><Icon name="trash" /> {t('habitat.danger.button')}</button
		>
	</form>
</div>
