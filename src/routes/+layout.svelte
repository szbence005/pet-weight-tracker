<script lang="ts">
	import '@picocss/pico/css/pico.min.css';
	import '../app.css';
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.png';
	import Icon from '#lib/components/Icon.svelte';
	import { provideT, useT } from '#lib/i18n/context.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	provideT(() => data.locale);
	const t = useT();

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
			<nav aria-label={t('nav.main')}>
				<a href="/pets" aria-current={onPets ? 'page' : undefined}
					><Icon name="heart" /> {t('nav.pets')}</a
				>
				<a href="/habitats" aria-current={onHabitats ? 'page' : undefined}
					><Icon name="organization" /> {t('nav.habitats')}</a
				>
			</nav>
		{/if}
		<div class="bar-end">
			<form method="post" action="/locale" class="langswitch" aria-label={t('lang.switch')}>
				<input type="hidden" name="redirectTo" value={page.url.pathname + page.url.search} />
				<button
					type="submit"
					name="locale"
					value="hu"
					class="topbtn"
					aria-label={t('lang.hu')}
					aria-pressed={data.locale === 'hu'}>HU</button
				>
				<button
					type="submit"
					name="locale"
					value="en"
					class="topbtn"
					aria-label={t('lang.en')}
					aria-pressed={data.locale === 'en'}>EN</button
				>
			</form>
			{#if data.user}
				<span class="who">{data.user.name}</span>
				<form method="post" action="/logout">
					<button type="submit" class="topbtn"><Icon name="sign-out" /> {t('auth.logout')}</button>
				</form>
			{:else}
				<a href="/login">{t('auth.login')}</a>
			{/if}
		</div>
	</div>
</header>

<main class="page">
	{@render children()}
</main>

<style>
	.langswitch {
		display: flex;
		gap: 0.25rem;
		margin: 0;
	}
	.langswitch button[aria-pressed='true'] {
		font-weight: 700;
		text-decoration: underline;
	}
</style>
