<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '#lib/components/Icon.svelte';
	import { HABITAT_KINDS, kindLabel } from '#lib/habitat-form.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const failed = $derived(form?.success === false ? form : null);
	const saved = $derived(form?.success === true);
	// After a failed save show what the user typed; otherwise the stored values.
	const values = $derived(failed?.values ?? data.habitat);
</script>

<svelte:head>
	<title>{data.habitat.name}</title>
</svelte:head>

<p><a href="/habitats">&larr; Vissza az egy&#252;tt&#233;l&#233;shez</a></p>

<div class="pet-head">
	<h1>{data.habitat.name}</h1>
	<p class="muted">
		{kindLabel(data.habitat.kind)}{data.habitat.notes ? ` \u00b7 ${data.habitat.notes}` : ''}
	</p>
</div>

<h2>Ki &#233;l itt?</h2>

{#if data.habitat.pets.length === 0}
	<article class="empty">
		<p class="muted">M&#233;g nem lakik itt senki.</p>
	</article>
{:else}
	<div class="overflow-auto">
		<table>
			<thead>
				<tr><th>N&#233;v</th><th>Faj</th><th></th></tr>
			</thead>
			<tbody>
				{#each data.habitat.pets as pet (pet.id)}
					<tr>
						<td><a href="/pets/{pet.id}">{pet.name}</a></td>
						<td>{pet.species}</td>
						<td>
							<form method="post" action="?/removePet" use:enhance>
								<input type="hidden" name="petId" value={pet.id} />
								<button
									type="submit"
									class="secondary outline small icon-btn"
									aria-label="Kiv&#233;tel az &#233;l&#337;helyb&#337;l"
									title="Kiv&#233;tel az &#233;l&#337;helyb&#337;l"><Icon name="x" /></button
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
			Kedvenc hozz&#225;ad&#225;sa
			<select name="petId" required>
				<option value="" disabled selected>V&#225;lassz kedvencet</option>
				{#each data.candidates as pet (pet.id)}
					<option value={pet.id}>{pet.name} ({pet.species})</option>
				{/each}
			</select>
		</label>
		<button type="submit"><Icon name="plus" /> Hozz&#225;ad&#225;s</button>
	</form>
{:else}
	<p class="muted"><small>Nincs t&#246;bb hozz&#225;adhat&#243; kedvenc.</small></p>
{/if}

<h2>Szerkeszt&#233;s</h2>

{#if saved}
	<p role="status"><ins>Mentve.</ins></p>
{/if}

<form method="post" action="?/update" use:enhance>
	<label>
		N&#233;v
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
		T&#237;pus
		<select name="kind" aria-invalid={failed?.errors.kind ? 'true' : undefined} required>
			{#each HABITAT_KINDS as kind (kind)}
				<option value={kind} selected={values.kind === kind}>{kindLabel(kind)}</option>
			{/each}
		</select>
		{#if failed?.errors.kind}<small class="error">{failed.errors.kind}</small>{/if}
	</label>

	<label>
		Megjegyz&#233;s (nem k&#246;telez&#337;)
		<textarea
			name="notes"
			maxlength="500"
			rows="3"
			aria-invalid={failed?.errors.notes ? 'true' : undefined}>{values.notes ?? ''}</textarea
		>
		{#if failed?.errors.notes}<small class="error">{failed.errors.notes}</small>{/if}
	</label>

	<button type="submit">Ment&#233;s</button>
</form>

<div class="danger-zone">
	<h3><Icon name="alert" /> Vesz&#233;lyes z&#243;na</h3>
	<p class="muted">
		Az &#233;l&#337;hely t&#246;rl&#233;se a kedvenceket nem t&#246;rli, csak az
		&#246;sszekapcsol&#225;st. Ez nem vonhat&#243; vissza.
	</p>
	<!-- Plain POST (no use:enhance): the server redirects to /habitats afterwards. -->
	<form
		method="post"
		action="?/delete"
		onsubmit={(event) => {
			if (
				!confirm(`Biztosan t\u00f6rl\u00f6d: ${data.habitat.name}? Ez nem vonhat\u00f3 vissza.`)
			) {
				event.preventDefault();
			}
		}}
	>
		<button type="submit" class="danger outline"
			><Icon name="trash" /> &#201;l&#337;hely t&#246;rl&#233;se</button
		>
	</form>
</div>
