<script lang="ts">
	import { useT } from '#lib/i18n/context.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const t = useT();
</script>

<svelte:head>
	<title>Pet Weight Tracker</title>
</svelte:head>

<h1>Pet Weight Tracker</h1>
<p class="muted">{t('home.tagline')}</p>

<p>
	{#if data.user}
		<a href="/pets" role="button">{t('home.cta')}</a>
	{:else}
		<a href="/login" role="button">{t('auth.login')}</a>
		<a href="/signup" role="button" class="secondary outline">{t('signup.title')}</a>
	{/if}
</p>
