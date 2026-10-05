<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>Elfelejtett jelszó</title>
</svelte:head>

<section>
	<h1>Elfelejtett jelszó</h1>

	{#if form?.sent}
		<article>
			<p>
				Ha ehhez a címhez tartozik fiók, elküldtük a jelszó-visszaállító linket. Nézd meg a bejövő
				és a spam mappát is. A link egy óráig érvényes.
			</p>
		</article>
	{:else}
		<form method="POST" use:enhance>
			<label>
				E-mail cím
				<input type="email" name="email" value={form?.email ?? ''} autocomplete="email" required />
			</label>
			{#if form?.message}
				<p role="alert">{form.message}</p>
			{/if}
			<button type="submit">Link küldése</button>
		</form>
	{/if}

	<p><a href="/login">Vissza a belépéshez</a></p>
</section>
