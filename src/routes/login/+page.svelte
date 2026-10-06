<script lang="ts">
	import { enhance } from '$app/forms';
	import { useT } from '#lib/i18n/context.ts';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	const t = useT();
</script>

<svelte:head>
	<title>{t('auth.login')}</title>
</svelte:head>

<div class="auth-wide">
	<article>
		<h2>{t('auth.login')}</h2>
		<form method="post" action="?/signIn" use:enhance>
			<label>
				{t('login.email')}
				<input
					type="email"
					name="email"
					autocomplete="email"
					value={form?.action === 'signIn' ? form.email : ''}
					required
				/>
			</label>
			<label>
				{t('login.password')}
				<input type="password" name="password" autocomplete="current-password" required />
			</label>
			{#if form?.action === 'signIn'}
				<p class="error" role="alert">{form.message}</p>
			{/if}
			<button type="submit">{t('auth.login')}</button>
		</form>
		<p class="muted"><small><a href="/forgot-password">{t('login.forgot')}</a></small></p>
	</article>

	<article>
		<h2>{t('signup.title')}</h2>
		<form method="post" action="?/signUp" use:enhance>
			<label>
				{t('signup.name')}
				<input name="name" autocomplete="name" required />
			</label>
			<label>
				{t('login.email')}
				<input
					type="email"
					name="email"
					autocomplete="email"
					value={form?.action === 'signUp' ? form.email : ''}
					required
				/>
			</label>
			<label>
				{t('signup.password', { min: data.minPasswordLength })}
				<input
					type="password"
					name="password"
					autocomplete="new-password"
					minlength={data.minPasswordLength}
					required
				/>
			</label>
			{#if form?.action === 'signUp'}
				<p class="error" role="alert">{form.message}</p>
			{/if}
			<button type="submit" class="secondary">{t('signup.submit')}</button>
		</form>
	</article>
</div>
