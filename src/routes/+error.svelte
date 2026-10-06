<script lang="ts">
	import { page } from '$app/state';
	import { useT } from '#lib/i18n/context.ts';

	const t = useT();
	const notFound = $derived(page.status === 404);
</script>

<svelte:head>
	<title>{notFound ? t('error.notFoundTitle') : t('error.genericTitle')}</title>
</svelte:head>

<div class="empty">
	<h1>{page.status}</h1>
	<p class="muted">
		{notFound ? t('error.notFoundText') : t('error.genericText')}
	</p>
	<p><a href="/pets" role="button">{t('error.backToPets')}</a></p>
</div>
