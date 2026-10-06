<script lang="ts">
	import { icons, type IconName, type IconPath } from '#lib/icons.ts';

	// Decorative by default (aria-hidden). Pass `label` only when the icon stands alone.
	let { name, size = 16, label }: { name: IconName; size?: number; label?: string } = $props();

	// The generated map has exact literal types (no icon uses evenodd yet), so widen it here.
	const paths: IconPath[] = $derived(icons[name]);
</script>

<svg
	class="icon"
	viewBox="0 0 16 16"
	width={size}
	height={size}
	fill="currentColor"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
>
	{#each paths as p, i (i)}
		<path d={p.d} fill-rule={p.evenodd ? 'evenodd' : undefined} />
	{/each}
</svg>

<style>
	.icon {
		display: inline-block;
		vertical-align: text-bottom;
		flex-shrink: 0;
	}
</style>
