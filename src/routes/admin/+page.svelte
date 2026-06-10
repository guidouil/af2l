<script lang="ts">
	import { resolve } from '$app/paths';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Administration | À fleur de lignes</title>
</svelte:head>

<section class="admin-page">
	<header class="admin-heading">
		<div>
			<h1>Tableau de bord</h1>
			<p>Vue d’ensemble du contenu publié et des brouillons.</p>
		</div>
		<a class="button" href={resolve('/')} target="_blank" rel="noreferrer">Voir le site</a>
	</header>

	{#if form?.message}
		<p class="message">{form.message}</p>
	{/if}

	<div class="stats">
		<section class="panel panel-inner">
			<span>Pages</span>
			<strong>{data.pages.length}</strong>
		</section>
		<section class="panel panel-inner">
			<span>Publiées</span>
			<strong>{data.publishedCount}</strong>
		</section>
		<section class="panel panel-inner">
			<span>Brouillons seuls</span>
			<strong>{data.draftOnlyCount}</strong>
		</section>
		<section class="panel panel-inner">
			<span>Médias</span>
			<strong>{data.mediaCount}</strong>
		</section>
	</div>

	{#if data.pages.length === 0}
		<form method="POST" action="?/seed" class="panel panel-inner empty-state">
			<div>
				<h2>Base de contenu vide</h2>
				<p class="muted">Crée les pages et réglages correspondant au site actuel.</p>
			</div>
			<button type="submit">Créer le contenu initial</button>
		</form>
	{/if}

	<section class="panel">
		<div class="panel-inner section-title">
			<div>
				<h2>Actions rapides</h2>
				<p class="muted">Les changements restent en brouillon jusqu’à publication.</p>
			</div>
		</div>
		<div class="quick-actions">
			<a href={resolve('/admin/pages')}>Gérer les pages</a>
			<a href={resolve('/admin/tarifs')}>Modifier les tarifs</a>
			<a href={resolve('/admin/media')}>Ajouter un média</a>
			<a href={resolve('/admin/settings')}>Paramètres SEO</a>
		</div>
	</section>
</section>

<style>
	.stats {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1rem;
	}

	.stats section {
		display: grid;
		gap: 0.35rem;
	}

	.stats span {
		color: #70695e;
		font-size: 0.85rem;
		text-transform: uppercase;
	}

	.stats strong {
		font-size: 2rem;
		line-height: 1;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	h2 {
		margin: 0;
	}

	.section-title {
		border-bottom: 1px solid #ded6c8;
	}

	.quick-actions {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}

	.quick-actions a {
		padding: 1rem;
		border-right: 1px solid #ded6c8;
		color: #1f1d1a;
		text-decoration: none;
		font-weight: 700;
	}

	.quick-actions a:last-child {
		border-right: 0;
	}

	.quick-actions a:hover {
		background: #f8f3e7;
	}

	@media (max-width: 880px) {
		.stats,
		.quick-actions {
			grid-template-columns: 1fr;
		}

		.quick-actions a {
			border-right: 0;
			border-bottom: 1px solid #ded6c8;
		}

		.empty-state {
			display: grid;
		}
	}
</style>
