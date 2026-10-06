<script lang="ts">
	import { page } from '$app/state';

	const notFound = $derived(page.status === 404);
</script>

<svelte:head>
	<title>{notFound ? 'Nem található' : 'Hiba történt'}</title>
</svelte:head>

<div class="empty">
	<h1>{page.status}</h1>
	<p class="muted">
		{notFound ? 'Ez az oldal nem található.' : 'Hiba történt. Próbáld újra egy kicsit később.'}
	</p>
	<p><a href="/pets" role="button">Vissza a kedvencekhez</a></p>
</div>
