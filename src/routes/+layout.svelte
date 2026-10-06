<script lang="ts">
	import '@picocss/pico/css/pico.min.css';
	import '../app.css';
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const onPets = $derived(page.url.pathname.startsWith('/pets'));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="topbar">
	<div class="page bar">
		<a class="brand" href="/">Pet Weight Tracker</a>
		{#if data.user}
			<nav aria-label="Főmenü">
				<a href="/pets" aria-current={onPets ? 'page' : undefined}>Kedvenceim</a>
			</nav>
		{/if}
		<div class="bar-end">
			{#if data.user}
				<span class="who">{data.user.name}</span>
				<form method="post" action="/logout">
					<button type="submit" class="topbtn">Kijelentkezés</button>
				</form>
			{:else}
				<a href="/login">Belépés</a>
			{/if}
		</div>
	</div>
</header>

<main class="page">
	{@render children()}
</main>
