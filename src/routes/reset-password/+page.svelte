<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Új jelszó beállítása</title>
</svelte:head>

<section>
	<h1>Új jelszó beállítása</h1>

	{#if form?.success}
		<article>
			<p>A jelszavad megváltozott. Most már beléphetsz az új jelszóval.</p>
			<a href="/login" role="button">Belépés</a>
		</article>
	{:else if data.invalid}
		<article>
			<p>A link érvénytelen vagy lejárt.</p>
			<a href="/forgot-password">Új link kérése</a>
		</article>
	{:else}
		<form method="POST" use:enhance>
			<input type="hidden" name="token" value={data.token} />
			<label>
				Új jelszó
				<input type="password" name="password" autocomplete="new-password" minlength="8" required />
			</label>
			<label>
				Új jelszó mégegyszer
				<input type="password" name="confirm" autocomplete="new-password" minlength="8" required />
			</label>
			{#if form?.message}
				<p role="alert">{form.message}</p>
			{/if}
			<button type="submit">Jelszó mentése</button>
		</form>
	{/if}
</section>
