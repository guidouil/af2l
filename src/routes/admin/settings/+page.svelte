<script lang="ts">
	import { untrack } from 'svelte';
	import type { SiteSettings } from '$lib/content/types';

	let { data, form } = $props();

	let settings = $state<SiteSettings>(untrack(() => structuredClone(data.settings)));
	let serializedSettings = $derived(JSON.stringify(settings));
</script>

<svelte:head>
	<title>Paramètres | Administration</title>
</svelte:head>

<section class="admin-page">
	<header class="admin-heading">
		<div>
			<h1>Paramètres</h1>
			<p>Réglages globaux utilisés par les métadonnées et la couverture.</p>
		</div>
	</header>

	{#if form?.message}
		<p class="message">{form.message}</p>
	{/if}

	<form method="POST" action="?/save" class="settings-form">
		<input type="hidden" name="settings" value={serializedSettings} />

		<section class="panel panel-inner grid two">
			<label>
				Nom du site
				<input bind:value={settings.siteName} />
			</label>
			<label>
				Image OpenGraph
				<input bind:value={settings.ogImage} />
			</label>
			<label>
				Logo clair
				<input bind:value={settings.coverLogoLight} />
			</label>
			<label>
				Logo sombre
				<input bind:value={settings.coverLogoDark} />
			</label>
			<label class="wide">
				Description
				<textarea bind:value={settings.siteDescription}></textarea>
			</label>
		</section>

		<div class="sticky-actions">
			<button type="submit">Enregistrer le brouillon</button>
			<button type="submit" formaction="?/publish" formmethod="POST" class="secondary"
				>Publier</button
			>
		</div>
	</form>
</section>

<style>
	.settings-form {
		display: grid;
		gap: 1rem;
	}

	.wide {
		grid-column: 1 / -1;
	}

	.sticky-actions {
		position: sticky;
		bottom: 0;
		display: flex;
		gap: 0.6rem;
		padding: 0.85rem;
		border: 1px solid #ded6c8;
		border-radius: 8px;
		background: rgba(255, 253, 248, 0.94);
		backdrop-filter: blur(12px);
	}
</style>
