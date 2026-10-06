<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '#lib/components/Icon.svelte';
	import { HABITAT_KINDS, kindLabel } from '#lib/habitat-form.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const failed = $derived(form?.success === false ? form : null);
</script>

<svelte:head>
	<title>Egy&#252;tt&#233;l&#233;s</title>
</svelte:head>

<h1>Egy&#252;tt&#233;l&#233;s</h1>
<p class="muted">
	Itt l&#225;tod, melyik kedvencek &#233;lnek egy&#252;tt egy &#233;l&#337;helyen (akv&#225;rium,
	t&#243;, kifut&#243; ...). Egy kedvenc t&#246;bb &#233;l&#337;helyhez is tartozhat.
</p>

{#if data.habitats.length === 0}
	<article class="empty">
		<p class="muted">
			M&#233;g nincs &#233;l&#337;helyed. Hozd l&#233;tre az els&#337;t az al&#225;bbi
			&#369;rlappal.
		</p>
	</article>
{:else}
	<div class="card-grid">
		{#each data.habitats as habitat (habitat.id)}
			<article class="habitat-card">
				<h3><a href="/habitats/{habitat.id}">{habitat.name}</a></h3>
				<p class="muted">{kindLabel(habitat.kind)}</p>
				{#if habitat.pets.length === 0}
					<small class="muted">M&#233;g nem lakik itt senki.</small>
				{:else}
					<ul class="chips">
						{#each habitat.pets as pet (pet.id)}
							<li><a href="/pets/{pet.id}">{pet.name}</a></li>
						{/each}
					</ul>
				{/if}
			</article>
		{/each}
	</div>
{/if}

<details open={data.habitats.length === 0 || failed !== null}>
	<!-- svelte-ignore a11y_no_redundant_roles -->
	<summary role="button" class="secondary"
		><Icon name="plus" /> &#218;j &#233;l&#337;hely hozz&#225;ad&#225;sa</summary
	>

	<form method="post" action="?/create" use:enhance>
		<label>
			N&#233;v
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
			T&#237;pus
			<select name="kind" aria-invalid={failed?.errors.kind ? 'true' : undefined} required>
				<option value="" disabled selected={!failed?.values.kind}>V&#225;lassz&#8230;</option>
				{#each HABITAT_KINDS as kind (kind)}
					<option value={kind} selected={failed?.values.kind === kind}>{kindLabel(kind)}</option>
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
				aria-invalid={failed?.errors.notes ? 'true' : undefined}
				>{failed?.values.notes ?? ''}</textarea
			>
			{#if failed?.errors.notes}<small class="error">{failed.errors.notes}</small>{/if}
		</label>

		<button type="submit">Ment&#233;s</button>
	</form>
</details>

<style>
	.habitat-card {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.habitat-card h3,
	.habitat-card p {
		margin: 0;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin: 0.4rem 0 0;
		padding: 0;
		list-style: none;
	}

	.chips li {
		margin: 0;
		padding: 0.1rem 0.6rem;
		border: 1px solid var(--gh-border);
		border-radius: 2rem;
		background: var(--gh-subtle);
		font-size: 0.85rem;
	}
</style>
