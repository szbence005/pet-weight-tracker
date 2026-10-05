<script lang="ts">
	import '@picocss/pico/css/pico.min.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="container">
	<nav>
		<ul>
			<li><a href="/"><strong>Pet Weight Tracker</strong></a></li>
		</ul>
		<ul>
			{#if data.user}
				<li>{data.user.name}</li>
				<li>
					<form method="post" action="/logout">
						<button type="submit" class="secondary outline">Kijelentkezés</button>
					</form>
				</li>
			{:else}
				<li><a href="/login">Belépés</a></li>
			{/if}
		</ul>
	</nav>
</header>

<main class="container">
	{@render children()}
</main>
