<script lang="ts">
	import { enhance } from '$app/forms';
	import { useT } from '#lib/i18n/context.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const t = useT();
</script>

<svelte:head>
	<title>{t('reset.title')}</title>
</svelte:head>

<div class="auth">
	<h1>{t('reset.title')}</h1>

	<article>
		{#if form?.success}
			<p>{t('reset.success')}</p>
			<a href="/login" role="button">{t('auth.login')}</a>
		{:else if data.invalid}
			<p>{t('reset.invalid')}</p>
			<a href="/forgot-password">{t('reset.newLink')}</a>
		{:else}
			<form method="POST" use:enhance>
				<input type="hidden" name="token" value={data.token} />
				<label>
					{t('reset.password')}
					<input
						type="password"
						name="password"
						autocomplete="new-password"
						minlength={data.minPasswordLength}
						required
					/>
				</label>
				<label>
					{t('reset.confirm')}
					<input
						type="password"
						name="confirm"
						autocomplete="new-password"
						minlength={data.minPasswordLength}
						required
					/>
				</label>
				{#if form?.message}
					<p class="error" role="alert">{form.message}</p>
				{/if}
				<button type="submit">{t('reset.submit')}</button>
			</form>
		{/if}
	</article>
</div>
