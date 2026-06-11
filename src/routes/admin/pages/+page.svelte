<script lang="ts">
	import { resolve } from '$app/paths';
	import { getPageKindDefinition, pageKindDefinitions } from '$lib/content/page-types';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Pages | Administration</title>
</svelte:head>

<section class="admin-page">
	<header class="admin-heading">
		<div>
			<h1>Pages</h1>
			<p>Organise le livre, crée de nouvelles pages et publie les brouillons.</p>
		</div>
	</header>

	{#if form?.message}
		<p class="message">{form.message}</p>
	{/if}

	<section class="panel">
		<div class="panel-inner">
			<h2>Nouvelle page</h2>
			<form method="POST" action="?/create" class="create-form">
				<label>
					Titre
					<input name="title" required />
				</label>
				<label>
					Slug
					<input name="slug" placeholder="nouvelle-page" />
				</label>
				<label>
					Type de page
					<select name="kind">
						{#each pageKindDefinitions as definition (definition.value)}
							<option value={definition.value}>{definition.label}</option>
						{/each}
					</select>
				</label>
				<label>
					Libellé navigation
					<input name="navLabel" />
				</label>
				<label>
					Note navigation
					<input name="navNote" />
				</label>
				<label>
					Titre SEO
					<input name="seoTitle" />
				</label>
				<label>
					Description SEO
					<input name="seoDescription" />
				</label>
				<button type="submit">Créer la page</button>
			</form>
		</div>
	</section>

	<section class="panel">
		<div class="pages-list">
			{#each data.pages as item, index (item.id)}
				<article>
					<div class="page-rank">{String(index + 1).padStart(2, '0')}</div>
					<div>
						<h2>{item.draft?.title ?? item.published?.title ?? (item.slug || 'Couverture')}</h2>
						<p class="muted">
							/{item.slug || 'accueil'} · {getPageKindDefinition(item.kind).label} · {item.showInNav
								? 'dans le sommaire'
								: 'hors sommaire'}
						</p>
						<div class="badges">
							<span class:ok={item.published}>Publié</span>
							<span class:ok={item.draft}>Brouillon</span>
							{#if item.isSystem}<span>Système</span>{/if}
						</div>
					</div>
					<div class="row-actions">
						<form method="POST" action="?/move">
							<input type="hidden" name="id" value={item.id} />
							<input type="hidden" name="direction" value="up" />
							<button class="secondary" type="submit" disabled={index === 0}>Monter</button>
						</form>
						<form method="POST" action="?/move">
							<input type="hidden" name="id" value={item.id} />
							<input type="hidden" name="direction" value="down" />
							<button class="secondary" type="submit" disabled={index === data.pages.length - 1}>
								Descendre
							</button>
						</form>
						<a class="button secondary" href={resolve(`/admin/pages/${item.id}`)}>Modifier</a>
						<form method="POST" action="?/publish">
							<input type="hidden" name="id" value={item.id} />
							<button type="submit" disabled={!item.draft}>Publier</button>
						</form>
						<form method="POST" action="?/delete">
							<input type="hidden" name="id" value={item.id} />
							<button class="danger" type="submit" disabled={item.isSystem}>Supprimer</button>
						</form>
					</div>
				</article>
			{/each}
		</div>
	</section>
</section>

<style>
	h2 {
		margin: 0;
	}

	.create-form {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1rem;
		align-items: end;
	}

	.create-form button {
		width: fit-content;
	}

	.pages-list {
		display: grid;
	}

	.pages-list article {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		gap: 1rem;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #ded6c8;
	}

	.pages-list article:last-child {
		border-bottom: 0;
	}

	.page-rank {
		width: 2.4rem;
		height: 2.4rem;
		display: grid;
		place-items: center;
		border: 1px solid #ded6c8;
		border-radius: 6px;
		color: #70695e;
		font-weight: 700;
	}

	.badges,
	.row-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		align-items: center;
	}

	.badges {
		margin-top: 0.55rem;
	}

	.badges span {
		border: 1px solid #ded6c8;
		border-radius: 999px;
		padding: 0.18rem 0.5rem;
		color: #70695e;
		font-size: 0.75rem;
	}

	.badges span.ok {
		border-color: #9bbd88;
		color: #315a24;
		background: #eef8e8;
	}

	@media (max-width: 1050px) {
		.create-form,
		.pages-list article {
			grid-template-columns: 1fr;
		}
	}
</style>
