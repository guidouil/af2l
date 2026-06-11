<script lang="ts">
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import type { PageBlock } from '$lib/content/types';

	let { data, form } = $props();

	let blocks = $state<PageBlock[]>(untrack(() => structuredClone(data.page.draft?.blocks ?? [])));
	let serializedBlocks = $derived(JSON.stringify(blocks));

	const blockTypes: { value: PageBlock['type']; label: string }[] = [
		{ value: 'hero', label: 'Hero' },
		{ value: 'paragraphs', label: 'Paragraphes' },
		{ value: 'list', label: 'Liste' },
		{ value: 'catalogueCards', label: 'Catalogue' },
		{ value: 'contactLinks', label: 'Contacts' },
		{ value: 'pricingConfigurator', label: 'Configurateur tarifs' },
		{ value: 'image', label: 'Image' },
		{ value: 'cta', label: 'Bouton' }
	];

	function createBlock(type: PageBlock['type']): PageBlock {
		const id = `${type}-${crypto.randomUUID()}`;
		if (type === 'hero')
			return { id, type, title: 'Titre', body: '', buttonLabel: '', targetSlug: '' };
		if (type === 'paragraphs') return { id, type, title: 'Titre', paragraphs: ['Nouveau texte.'] };
		if (type === 'list') return { id, type, title: 'Liste', items: ['Premier élément'] };
		if (type === 'catalogueCards') return { id, type, title: 'Catalogue', cards: [] };
		if (type === 'contactLinks') return { id, type, title: 'Contacts', links: [] };
		if (type === 'pricingConfigurator')
			return { id, type, title: 'Configurateur de prix', lead: '' };
		if (type === 'image') return { id, type, alt: '', caption: '' };
		return { id, type, label: 'Lire la suite', targetSlug: '' };
	}

	function addBlock(type: PageBlock['type']) {
		blocks = [...blocks, createBlock(type)];
	}

	function changeBlockType(index: number, type: PageBlock['type']) {
		blocks[index] = createBlock(type);
	}

	function moveBlock(index: number, direction: -1 | 1) {
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= blocks.length) return;
		const copy = [...blocks];
		[copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
		blocks = copy;
	}

	function deleteBlock(index: number) {
		blocks = blocks.filter((_, itemIndex) => itemIndex !== index);
	}

	function lines(values: string[]) {
		return values.join('\n');
	}

	function setLines(index: number, key: 'paragraphs' | 'items', value: string) {
		const block = blocks[index];
		const values = value
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean);

		if (block.type === 'paragraphs' && key === 'paragraphs') {
			block.paragraphs = values;
		}

		if (block.type === 'list' && key === 'items') {
			block.items = values;
		}
	}

	function formatCards(block: Extract<PageBlock, { type: 'catalogueCards' }>) {
		return block.cards
			.map((card) => `${card.tag}|${card.title}|${card.author}|${card.status}`)
			.join('\n');
	}

	function setCards(index: number, value: string) {
		const block = blocks[index];
		if (block.type !== 'catalogueCards') return;
		block.cards = value
			.split('\n')
			.map((line) => line.split('|').map((part) => part.trim()))
			.filter((parts) => parts.some(Boolean))
			.map(([tag = '', title = '', author = '', status = '']) => ({ tag, title, author, status }));
	}

	function formatLinks(block: Extract<PageBlock, { type: 'contactLinks' }>) {
		return block.links.map((link) => `${link.label}|${link.href}|${link.text}`).join('\n');
	}

	function setLinks(index: number, value: string) {
		const block = blocks[index];
		if (block.type !== 'contactLinks') return;
		block.links = value
			.split('\n')
			.map((line) => line.split('|').map((part) => part.trim()))
			.filter((parts) => parts.some(Boolean))
			.map(([label = '', href = '', text = '']) => ({ label, href, text }));
	}
</script>

<svelte:head>
	<title>{data.page.draft?.title ?? data.page.slug} | Pages</title>
</svelte:head>

<section class="admin-page">
	<header class="admin-heading">
		<div>
			<h1>{data.page.draft?.title ?? (data.page.slug || 'Couverture')}</h1>
			<p>Modification du brouillon. La publication est une action séparée.</p>
		</div>
		<a class="button secondary" href={resolve('/admin/pages')}>Retour aux pages</a>
	</header>

	{#if form?.message}
		<p class="message">{form.message}</p>
	{/if}

	<form method="POST" action="?/save" class="editor">
		<input type="hidden" name="blocks" value={serializedBlocks} />

		<section class="panel">
			<div class="panel-inner grid two">
				<label>
					Slug
					<input name="slug" value={data.page.slug} disabled={data.page.slug === ''} />
				</label>
				<label>
					Type de page
					<select name="kind" value={data.page.kind}>
						<option value="standard">Page standard</option>
						<option value="cover">Couverture</option>
						<option value="back_cover">Dos</option>
					</select>
				</label>
				<label class="checkbox">
					<input name="showInNav" type="checkbox" checked={data.page.showInNav} />
					Afficher dans le sommaire
				</label>
			</div>
		</section>

		<section class="panel">
			<div class="panel-inner grid two">
				<label>
					Titre
					<input name="title" value={data.page.draft?.title ?? ''} required />
				</label>
				<label>
					Libellé sommaire
					<input name="navLabel" value={data.page.draft?.navLabel ?? ''} required />
				</label>
				<label>
					Note sommaire
					<input name="navNote" value={data.page.draft?.navNote ?? ''} />
				</label>
				<label>
					Titre SEO
					<input name="seoTitle" value={data.page.draft?.seoTitle ?? ''} required />
				</label>
				<label class="wide">
					Description SEO
					<textarea name="seoDescription" required>{data.page.draft?.seoDescription ?? ''}</textarea
					>
				</label>
			</div>
		</section>

		<section class="panel">
			<div class="panel-inner blocks-header">
				<div>
					<h2>Blocs</h2>
					<p class="muted">Chaque bloc correspond à un rendu connu du livre public.</p>
				</div>
				<div class="add-block">
					{#each blockTypes as type (type.value)}
						<button class="secondary" type="button" onclick={() => addBlock(type.value)}>
							+ {type.label}
						</button>
					{/each}
				</div>
			</div>

			<div class="blocks">
				{#each blocks as block, index (block.id)}
					<article>
						<header>
							<select
								value={block.type}
								onchange={(event) =>
									changeBlockType(index, event.currentTarget.value as PageBlock['type'])}
							>
								{#each blockTypes as type (type.value)}
									<option value={type.value}>{type.label}</option>
								{/each}
							</select>
							<div>
								<button
									class="secondary"
									type="button"
									onclick={() => moveBlock(index, -1)}
									disabled={index === 0}
								>
									Monter
								</button>
								<button
									class="secondary"
									type="button"
									onclick={() => moveBlock(index, 1)}
									disabled={index === blocks.length - 1}
								>
									Descendre
								</button>
								<button class="danger" type="button" onclick={() => deleteBlock(index)}
									>Supprimer</button
								>
							</div>
						</header>

						{#if block.type === 'hero'}
							<div class="grid two">
								<label>Eyebrow <input bind:value={block.eyebrow} /></label>
								<label>Titre <input bind:value={block.title} /></label>
								<label class="wide">Texte <textarea bind:value={block.body}></textarea></label>
								<label>Bouton <input bind:value={block.buttonLabel} /></label>
								<label>Slug cible <input bind:value={block.targetSlug} /></label>
							</div>
						{:else if block.type === 'paragraphs'}
							<div class="grid two">
								<label>Eyebrow <input bind:value={block.eyebrow} /></label>
								<label>Titre <input bind:value={block.title} /></label>
								<label class="wide">
									Paragraphes, un par ligne
									<textarea
										value={lines(block.paragraphs)}
										oninput={(event) => setLines(index, 'paragraphs', event.currentTarget.value)}
									></textarea>
								</label>
							</div>
						{:else if block.type === 'list'}
							<div class="grid two">
								<label>Eyebrow <input bind:value={block.eyebrow} /></label>
								<label>Titre <input bind:value={block.title} /></label>
								<label class="wide"
									>Introduction <textarea bind:value={block.intro}></textarea></label
								>
								<label class="wide">
									Éléments, un par ligne
									<textarea
										value={lines(block.items)}
										oninput={(event) => setLines(index, 'items', event.currentTarget.value)}
									></textarea>
								</label>
							</div>
						{:else if block.type === 'catalogueCards'}
							<div class="grid two">
								<label>Eyebrow <input bind:value={block.eyebrow} /></label>
								<label>Titre <input bind:value={block.title} /></label>
								<label class="wide">
									Fiches : tag|titre|auteur|statut
									<textarea
										value={formatCards(block)}
										oninput={(event) => setCards(index, event.currentTarget.value)}
									></textarea>
								</label>
								<label class="wide">Note <textarea bind:value={block.note}></textarea></label>
								<label>Bouton <input bind:value={block.ctaLabel} /></label>
								<label>Slug cible <input bind:value={block.targetSlug} /></label>
							</div>
						{:else if block.type === 'contactLinks'}
							<div class="grid two">
								<label>Eyebrow <input bind:value={block.eyebrow} /></label>
								<label>Titre <input bind:value={block.title} /></label>
								<label class="wide">
									Liens : libellé|href|texte
									<textarea
										value={formatLinks(block)}
										oninput={(event) => setLinks(index, event.currentTarget.value)}
									></textarea>
								</label>
								<label>Bouton <input bind:value={block.ctaLabel} /></label>
								<label>Slug cible <input bind:value={block.targetSlug} /></label>
							</div>
						{:else if block.type === 'pricingConfigurator'}
							<div class="grid two">
								<label>Eyebrow <input bind:value={block.eyebrow} /></label>
								<label>Titre <input bind:value={block.title} /></label>
								<label class="wide">Texte <textarea bind:value={block.lead}></textarea></label>
							</div>
						{:else if block.type === 'image'}
							<div class="grid two">
								<label>
									Média
									<select bind:value={block.mediaId}>
										<option value={undefined}>Aucun</option>
										{#each data.media as asset (asset.id)}
											<option value={asset.id}>{asset.originalName}</option>
										{/each}
									</select>
								</label>
								<label>Texte alternatif <input bind:value={block.alt} /></label>
								<label class="wide">Légende <textarea bind:value={block.caption}></textarea></label>
							</div>
						{:else if block.type === 'cta'}
							<div class="grid two">
								<label>Libellé <input bind:value={block.label} /></label>
								<label>Slug cible <input bind:value={block.targetSlug} /></label>
							</div>
						{/if}
					</article>
				{/each}
			</div>
		</section>

		<div class="sticky-actions">
			<button type="submit">Enregistrer le brouillon</button>
			<button type="submit" formaction="?/publish" formmethod="POST" class="secondary"
				>Publier</button
			>
			<button
				type="submit"
				formaction="?/delete"
				formmethod="POST"
				class="danger"
				disabled={data.page.isSystem}
			>
				Supprimer
			</button>
		</div>
	</form>
</section>

<style>
	.editor {
		display: grid;
		gap: 1rem;
	}

	h2 {
		margin: 0;
	}

	.checkbox {
		display: flex;
		align-items: center;
		gap: 0.55rem;
	}

	.checkbox input {
		width: auto;
	}

	.wide {
		grid-column: 1 / -1;
	}

	.blocks-header {
		display: grid;
		gap: 1rem;
		border-bottom: 1px solid #ded6c8;
	}

	.add-block {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}

	.blocks {
		display: grid;
	}

	.blocks article {
		display: grid;
		gap: 1rem;
		padding: 1rem;
		border-bottom: 1px solid #ded6c8;
	}

	.blocks article:last-child {
		border-bottom: 0;
	}

	.blocks header {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}

	.blocks header div {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}

	.sticky-actions {
		position: sticky;
		bottom: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		padding: 0.85rem;
		border: 1px solid #ded6c8;
		border-radius: 8px;
		background: rgba(255, 253, 248, 0.94);
		backdrop-filter: blur(12px);
	}

	@media (max-width: 760px) {
		.blocks header {
			display: grid;
		}
	}
</style>
