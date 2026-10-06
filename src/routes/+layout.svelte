<script lang="ts">
	import '@picocss/pico/css/pico.min.css';
	import '../app.css';
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.png';
	import Icon from '#lib/components/Icon.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const onPets = $derived(page.url.pathname.startsWith('/pets'));
	const onHabitats = $derived(page.url.pathname.startsWith('/habitats'));
</script>

<svelte:head>
	<link rel="icon" type="image/png" href={favicon} />
</svelte:head>

<header class="topbar">
	<div class="page bar">
		<a class="brand" href="/">Pet Weight Tracker</a>
		{#if data.user}
			<nav aria-label="Főmenü">
				<a href="/pets" aria-current={onPets ? 'page' : undefined}
					><Icon name="heart" /> Kedvenceim</a
				>
				<a href="/habitats" aria-current={onHabitats ? 'page' : undefined}
					><Icon name="organization" /> Egy&#252;tt&#233;l&#233;s</a
				>
			</nav>
		{/if}
		<div class="bar-end">
			{#if data.user}
				<span class="who">{data.user.name}</span>
				<form method="post" action="/logout">
					<button type="submit" class="topbtn"><Icon name="sign-out" /> Kijelentkezés</button>
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
