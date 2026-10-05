<script lang="ts">
	import '@picocss/pico/css/pico.min.css';
	import DemoLinks from './demo/DemoLinks.svelte';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main class="container">
	{@render children()}
</main>
<DemoLinks />
