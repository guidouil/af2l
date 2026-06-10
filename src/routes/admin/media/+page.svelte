<script lang="ts">
	let { data, form } = $props();
</script>

<svelte:head>
	<title>Médias | Administration</title>
</svelte:head>

<section class="admin-page">
	<header class="admin-heading">
		<div>
			<h1>Médias</h1>
			<p>Images locales utilisables dans les blocs de page.</p>
		</div>
	</header>

	{#if form?.message}
		<p class="message">{form.message}</p>
	{/if}

	<section class="panel">
		<div class="panel-inner">
			<h2>Ajouter une image</h2>
			<form method="POST" action="?/upload" enctype="multipart/form-data" class="upload-form">
				<label>
					Fichier
					<input name="file" type="file" accept="image/png,image/jpeg,image/webp" required />
				</label>
				<label>
					Texte alternatif
					<input name="alt" />
				</label>
				<button type="submit">Envoyer</button>
			</form>
		</div>
	</section>

	<section class="media-grid">
		{#each data.media as asset (asset.id)}
			<article class="panel">
				<img src={`/media/${asset.id}`} alt={asset.alt || asset.originalName} />
				<div class="panel-inner">
					<h2>{asset.originalName}</h2>
					<p class="muted">{asset.mimeType} · {(asset.byteSize / 1024).toFixed(0)} Ko</p>
					<p class="url">/media/{asset.id}</p>
					<form method="POST" action="?/delete">
						<input type="hidden" name="id" value={asset.id} />
						<button class="danger" type="submit" disabled={asset.isReferenced}>Supprimer</button>
					</form>
				</div>
			</article>
		{/each}
	</section>
</section>

<style>
	h2 {
		margin: 0;
	}

	.upload-form {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
		gap: 1rem;
		align-items: end;
	}

	.media-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
		gap: 1rem;
	}

	.media-grid article {
		overflow: hidden;
	}

	img {
		width: 100%;
		aspect-ratio: 4 / 3;
		display: block;
		object-fit: cover;
		background: #eee7d8;
	}

	.url {
		margin: 0.75rem 0;
		border-radius: 4px;
		padding: 0.35rem 0.45rem;
		background: #f5f2ec;
		color: #70695e;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.8rem;
	}

	@media (max-width: 720px) {
		.upload-form {
			grid-template-columns: 1fr;
		}
	}
</style>
