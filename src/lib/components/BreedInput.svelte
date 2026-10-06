<script lang="ts">
	import { TURTLE_SPECIES } from '#lib/turtle-species.ts';

	// "Fajta" field. For turtles the browser offers a filtered suggestion list while typing;
	// any other text is still accepted.
	let {
		species,
		value = '',
		invalid = false
	}: { species: string; value?: string; invalid?: boolean } = $props();

	const isTurtle = $derived(species === 'teknős');
	const listId = 'turtle-species-list';
</script>

<input
	name="breed"
	maxlength="60"
	autocomplete="off"
	{value}
	list={isTurtle ? listId : undefined}
	aria-invalid={invalid ? 'true' : undefined}
/>
{#if isTurtle}
	<datalist id={listId}>
		{#each TURTLE_SPECIES as t (t.name)}
			<option value={t.name} label={t.latin}></option>
		{/each}
	</datalist>
	<small class="muted">
		Kezdj gépelni a szűréshez. Ha a faj nincs a listában, szabadon beírhatod.
	</small>
{/if}
