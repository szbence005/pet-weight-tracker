<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Belépés</title>
</svelte:head>

<div class="grid">
	<article>
		<h2>Belépés</h2>
		<form method="post" action="?/signIn" use:enhance>
			<label>
				E-mail
				<input
					type="email"
					name="email"
					autocomplete="email"
					value={form?.action === 'signIn' ? form.email : ''}
					required
				/>
			</label>
			<label>
				Jelszó
				<input type="password" name="password" autocomplete="current-password" required />
			</label>
			{#if form?.action === 'signIn'}
				<p class="error" role="alert">{form.message}</p>
			{/if}
			<button type="submit">Belépés</button>
		</form>
	</article>

	<article>
		<h2>Regisztráció</h2>
		<form method="post" action="?/signUp" use:enhance>
			<label>
				Név
				<input name="name" autocomplete="name" required />
			</label>
			<label>
				E-mail
				<input
					type="email"
					name="email"
					autocomplete="email"
					value={form?.action === 'signUp' ? form.email : ''}
					required
				/>
			</label>
			<label>
				Jelszó (legalább 8 karakter)
				<input type="password" name="password" autocomplete="new-password" minlength="8" required />
			</label>
			{#if form?.action === 'signUp'}
				<p class="error" role="alert">{form.message}</p>
			{/if}
			<button type="submit" class="secondary">Fiók létrehozása</button>
		</form>
	</article>
</div>

<style>
	.error {
		color: var(--pico-del-color);
	}
</style>
