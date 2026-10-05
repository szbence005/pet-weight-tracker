<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Kedvenceim</title>
</svelte:head>

<h1>Kedvenceim</h1>
<p>Szia, {data.name}! Itt jelennek majd meg a kedvenceid.</p>
