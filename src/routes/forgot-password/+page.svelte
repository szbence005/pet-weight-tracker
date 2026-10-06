<script lang="ts">
	import { enhance } from '$app/forms';
	import { useT } from '#lib/i18n/context.ts';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	const t = useT();
</script>

<svelte:head>
	<title>{t('forgot.title')}</title>
</svelte:head>

<div class="auth">
	<h1>{t('forgot.title')}</h1>

	<article>
		{#if form?.sent}
			<p>{t('forgot.sent')}</p>
		{:else}
			<form method="POST" use:enhance>
				<label>
					{t('forgot.email')}
					<input
						type="email"
						name="email"
						value={form?.email ?? ''}
						autocomplete="email"
						required
					/>
				</label>
				{#if form?.message}
					<p class="error" role="alert">{form.message}</p>
				{/if}
				<button type="submit">{t('forgot.submit')}</button>
			</form>
		{/if}
	</article>

	<p><a href="/login">{t('forgot.back')}</a></p>
</div>
