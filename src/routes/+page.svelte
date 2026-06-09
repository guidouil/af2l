<script lang="ts">
	import { tick } from 'svelte';

	type FlipCorner = 'top' | 'bottom';
	type PageFlip = import('page-flip/dist/js/page-flip.module.js').PageFlip;

	const contents = [
		{ title: 'Sommaire', page: 1, note: 'Carte du livre-site' },
		{ title: 'Manifeste', page: 2, note: 'Notre ligne éditoriale' },
		{ title: 'Collections', page: 3, note: 'Les formats de publication' },
		{ title: 'Catalogue', page: 4, note: 'Livres en vitrine' },
		{ title: 'Auteurs', page: 5, note: 'Voix accompagnées' },
		{ title: 'Manuscrits', page: 6, note: 'Soumettre un texte' },
		{ title: 'Journal', page: 7, note: 'Parutions et rencontres' },
		{ title: 'Contact', page: 8, note: 'Libraires, presse, droits' }
	];

	const pageNames = [
		'Couverture',
		'Sommaire',
		'Manifeste',
		'Collections',
		'Catalogue',
		'Auteurs',
		'Manuscrits',
		'Journal',
		'Contact',
		'Dos'
	];

	const collections = [
		{
			kicker: '01',
			title: 'Premières Lignes',
			text: 'Romans courts, récits intimes et textes qui gardent le frisson de leur première phrase.'
		},
		{
			kicker: '02',
			title: 'Herbier Noir',
			text: 'Poésie, fragments et formes hybrides pour les voix qui déplacent le papier.'
		},
		{
			kicker: '03',
			title: 'Marge Claire',
			text: 'Essais littéraires, correspondances et carnets de création.'
		}
	];

	const catalogue = [
		{
			title: 'Le Jardin des marges',
			author: 'M. Sorel',
			tag: 'Roman',
			status: 'Automne'
		},
		{
			title: 'Nuit botanique',
			author: 'Ana Vey',
			tag: 'Poésie',
			status: 'En lecture'
		},
		{
			title: 'Lettres de serre',
			author: 'Collectif',
			tag: 'Correspondances',
			status: 'Bientôt'
		}
	];

	const manuscriptSteps = [
		'Un synopsis d’une page',
		'Trois chapitres ou trente pages',
		'Une note d’intention',
		'Coordonnées et bibliographie courte'
	];

	let bookElement = $state<HTMLDivElement | undefined>();
	let pageFlip: PageFlip | null = null;
	let isReady = $state(false);
	let currentPage = $state(0);
	let totalPages = $state(pageNames.length);
	let orientation = $state<'portrait' | 'landscape'>('landscape');

	let currentLabel = $derived(pageNames[currentPage] ?? 'Page');
	let progress = $derived(Math.max(0, Math.min(100, ((currentPage + 1) / totalPages) * 100)));

	$effect(() => {
		const element = bookElement;

		if (!element) return;

		let cancelled = false;

		async function setupFlipbook(target: HTMLDivElement) {
			await tick();

			const { PageFlip } = await import('page-flip/dist/js/page-flip.module.js');

			if (cancelled) return;

			const pages = target.querySelectorAll<HTMLElement>('.book-page');
			pageFlip = new PageFlip(target, {
				width: 620,
				height: 860,
				size: 'stretch',
				minWidth: 280,
				maxWidth: 680,
				minHeight: 390,
				maxHeight: 940,
				drawShadow: true,
				flippingTime: 950,
				usePortrait: true,
				startZIndex: 1,
				autoSize: true,
				maxShadowOpacity: 0.32,
				showCover: true,
				mobileScrollSupport: true,
				swipeDistance: 35,
				clickEventForward: true,
				useMouseEvents: true,
				showPageCorners: true
			});

			pageFlip.on('init', (event) => {
				const data = event.data as { page?: number; mode?: 'portrait' | 'landscape' };
				currentPage =
					typeof data.page === 'number' ? data.page : (pageFlip?.getCurrentPageIndex() ?? 0);
				orientation = data.mode ?? pageFlip?.getOrientation() ?? 'landscape';
				totalPages = pageFlip?.getPageCount() ?? pages.length;
				isReady = true;
			});

			pageFlip.on('flip', (event) => {
				currentPage =
					typeof event.data === 'number' ? event.data : (pageFlip?.getCurrentPageIndex() ?? 0);
			});

			pageFlip.on('changeOrientation', (event) => {
				if (event.data === 'portrait' || event.data === 'landscape') {
					orientation = event.data;
				}
			});

			pageFlip.loadFromHTML(pages);
		}

		void setupFlipbook(element);

		return () => {
			cancelled = true;
			pageFlip?.destroy();
			pageFlip = null;
		};
	});

	function flipTo(page: number, corner: FlipCorner = 'bottom') {
		if (!pageFlip || page === currentPage) return;

		pageFlip.flip(page, corner);
	}

	function nextPage() {
		pageFlip?.flipNext('bottom');
	}

	function previousPage() {
		pageFlip?.flipPrev('bottom');
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowRight') nextPage();
		if (event.key === 'ArrowLeft') previousPage();
	}
</script>

<svelte:head>
	<title>À Fleur de Lignes éditions</title>
	<meta
		name="description"
		content="Maison d'édition indépendante présentée comme un livre interactif à feuilleter."
	/>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<main class="book-screen">
	<header class="book-status" aria-label="Position dans le livre">
		<button class="wordmark" type="button" onclick={() => flipTo(0, 'top')}
			>À Fleur de Lignes</button
		>
		<div class="page-track" aria-hidden="true" style={`--progress: ${progress}%`}></div>
		<span>{currentLabel}</span>
	</header>

	<section class="book-stage" aria-label="Livre interactif À Fleur de Lignes">
		<button
			class="turn-button turn-button--prev"
			type="button"
			onclick={previousPage}
			disabled={!isReady || currentPage === 0}
			aria-label="Page précédente"
			title="Page précédente"
		>
			‹
		</button>

		<div class="book-shadow">
			<div
				class:ready={isReady}
				class="flipbook"
				bind:this={bookElement}
				data-ready={isReady}
				aria-roledescription="livre interactif"
			>
				<article class="book-page cover-page" data-density="hard" aria-label="Couverture">
					<div class="cover-border">
						<picture>
							<source srcset="/assets/brand/logo-dark.png" media="(prefers-color-scheme: dark)" />
							<img src="/assets/brand/logo-light.png" alt="À Fleur de Lignes éditions" />
						</picture>

						<div class="cover-meta">
							<p>Maison d'édition indépendante</p>
							<h1>Des textes à ouvrir comme des fleurs.</h1>
							<button type="button" onclick={() => flipTo(1)} disabled={!isReady}
								>Ouvrir le livre</button
							>
						</div>
					</div>
				</article>

				<article class="book-page contents-page" aria-label="Sommaire">
					<div class="page-inner">
						<p class="folio">2</p>
						<h2>Sommaire</h2>
						<nav class="contents-list" aria-label="Sommaire du site">
							{#each contents as entry (entry.title)}
								<button
									type="button"
									onclick={() => flipTo(entry.page)}
									aria-current={currentPage === entry.page ? 'page' : undefined}
								>
									<span>{entry.title}</span>
									<small>{entry.note}</small>
									<i>{String(entry.page + 1).padStart(2, '0')}</i>
								</button>
							{/each}
						</nav>
					</div>
				</article>

				<article class="book-page manifesto-page" aria-label="Manifeste">
					<div class="page-inner">
						<p class="folio">3</p>
						<p class="eyebrow">Manifeste</p>
						<h2>Publier ce qui garde une trace de vivant.</h2>
						<p class="lead">
							À Fleur de Lignes défend des livres attentifs, précis, traversés par la langue et par
							le regard. Chaque texte est travaillé comme un objet de lecture, de la première note
							éditoriale au dernier détail de fabrication.
						</p>
						<div class="quote-block">
							<span>“</span>
							<p>Une maison pour les voix qui cherchent leur forme avant leur vitrine.</p>
						</div>
						<button class="inline-link" type="button" onclick={() => flipTo(3)}
							>Voir les collections</button
						>
					</div>
				</article>

				<article class="book-page collections-page" aria-label="Collections">
					<div class="page-inner">
						<p class="folio">4</p>
						<p class="eyebrow">Collections</p>
						<h2>Trois rayonnages, une même exigence.</h2>
						<div class="collection-grid">
							{#each collections as item (item.title)}
								<section>
									<small>{item.kicker}</small>
									<h3>{item.title}</h3>
									<p>{item.text}</p>
								</section>
							{/each}
						</div>
						<button class="inline-link" type="button" onclick={() => flipTo(4)}
							>Feuilleter le catalogue</button
						>
					</div>
				</article>

				<article class="book-page catalogue-page" aria-label="Catalogue">
					<div class="page-inner">
						<p class="folio">5</p>
						<p class="eyebrow">Catalogue</p>
						<h2>Livres en préparation</h2>
						<div class="shelf">
							{#each catalogue as book (book.title)}
								<section class="catalogue-card">
									<p>{book.tag}</p>
									<h3>{book.title}</h3>
									<span>{book.author}</span>
									<strong>{book.status}</strong>
								</section>
							{/each}
						</div>
						<div class="press-note">
							<p>Service presse, librairies et droits étrangers sur demande.</p>
							<button type="button" onclick={() => flipTo(8)}>Aller au contact</button>
						</div>
					</div>
				</article>

				<article class="book-page authors-page" aria-label="Auteurs">
					<div class="page-inner">
						<p class="folio">6</p>
						<p class="eyebrow">Auteurs</p>
						<h2>Accompagner une voix sans la lisser.</h2>
						<div class="author-layout">
							<div class="initial">A</div>
							<div>
								<p>
									Le travail éditorial commence par une écoute lente: structure, rythme,
									ponctuation, silence, promesse du livre à venir.
								</p>
								<p>
									La maison privilégie les dialogues longs, les tirages raisonnés et les liens
									durables avec les libraires.
								</p>
							</div>
						</div>
						<button class="inline-link" type="button" onclick={() => flipTo(6)}
							>Soumettre un manuscrit</button
						>
					</div>
				</article>

				<article class="book-page manuscript-page" aria-label="Manuscrits">
					<div class="page-inner">
						<p class="folio">7</p>
						<p class="eyebrow">Manuscrits</p>
						<h2>Ce que nous lisons en premier.</h2>
						<ol class="manuscript-list">
							{#each manuscriptSteps as step (step)}
								<li>{step}</li>
							{/each}
						</ol>
						<p class="lead small">
							Les envois rouvrent par sessions afin de lire chaque texte avec attention. Les projets
							de roman, poésie, récit et essai littéraire sont les bienvenus.
						</p>
						<button class="inline-link" type="button" onclick={() => flipTo(8)}
							>Préparer un envoi</button
						>
					</div>
				</article>

				<article class="book-page journal-page" aria-label="Journal">
					<div class="page-inner">
						<p class="folio">8</p>
						<p class="eyebrow">Journal</p>
						<h2>Notes d'atelier</h2>
						<div class="journal-stack">
							<section>
								<time datetime="2026-09">Septembre 2026</time>
								<h3>Ouverture de la première saison de manuscrits</h3>
							</section>
							<section>
								<time datetime="2026-10">Octobre 2026</time>
								<h3>Rencontre libraires autour des maquettes</h3>
							</section>
							<section>
								<time datetime="2026-11">Novembre 2026</time>
								<h3>Annonce de la collection inaugurale</h3>
							</section>
						</div>
					</div>
				</article>

				<article class="book-page contact-page" aria-label="Contact">
					<div class="page-inner">
						<p class="folio">9</p>
						<p class="eyebrow">Contact</p>
						<h2>Adresse éditoriale</h2>
						<div class="contact-grid">
							<a href="mailto:bonjour@afleurdelignes.fr">
								<span>Courriel</span>
								bonjour@afleurdelignes.fr
							</a>
							<a href="mailto:manuscrits@afleurdelignes.fr">
								<span>Manuscrits</span>
								manuscrits@afleurdelignes.fr
							</a>
							<a href="mailto:presse@afleurdelignes.fr">
								<span>Presse et libraires</span>
								presse@afleurdelignes.fr
							</a>
						</div>
						<button class="inline-link" type="button" onclick={() => flipTo(0, 'top')}
							>Retour couverture</button
						>
					</div>
				</article>

				<article
					class="book-page back-cover"
					data-density="hard"
					aria-label="Quatrième de couverture"
				>
					<div class="cover-border">
						<picture>
							<source srcset="/assets/brand/logo-dark.png" media="(prefers-color-scheme: dark)" />
							<img src="/assets/brand/logo-light.png" alt="À Fleur de Lignes éditions" />
						</picture>
						<p>
							À Fleur de Lignes imprime des livres pour celles et ceux qui lisent au bord des
							phrases.
						</p>
					</div>
				</article>
			</div>
		</div>

		<button
			class="turn-button turn-button--next"
			type="button"
			onclick={nextPage}
			disabled={!isReady || currentPage >= totalPages - 1}
			aria-label="Page suivante"
			title="Page suivante"
		>
			›
		</button>
	</section>

	<footer class="book-controls">
		<button type="button" onclick={() => flipTo(1)} disabled={!isReady}>Sommaire</button>
		<button type="button" onclick={() => flipTo(4)} disabled={!isReady}>Catalogue</button>
		<button type="button" onclick={() => flipTo(6)} disabled={!isReady}>Manuscrits</button>
		<span>{String(currentPage + 1).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}</span>
	</footer>
</main>

<style>
	:global(:root) {
		color-scheme: light;
		--screen-bg: #c9d0c7;
		--screen-ink: #151515;
		--screen-muted: #5d625a;
		--paper: #fbfaf4;
		--paper-deep: #eee7d8;
		--paper-ink: #171512;
		--paper-muted: #6d655c;
		--cover: #f7f7f4;
		--cover-ink: #0b0b0b;
		--line: rgba(22, 21, 19, 0.32);
		--accent: #49624d;
		--accent-strong: #7d2e34;
		--gold: #a37a36;
		--shadow: rgba(26, 19, 10, 0.28);
	}

	:global(*) {
		box-sizing: border-box;
		letter-spacing: 0;
	}

	@media (prefers-color-scheme: dark) {
		:global(:root) {
			color-scheme: dark;
			--screen-bg: #101412;
			--screen-ink: #f2eee6;
			--screen-muted: #a6aa9f;
			--paper: #24231f;
			--paper-deep: #181816;
			--paper-ink: #f5efe4;
			--paper-muted: #b9b1a3;
			--cover: #020202;
			--cover-ink: #f7f4eb;
			--line: rgba(246, 239, 226, 0.28);
			--accent: #9bb38f;
			--accent-strong: #d79a6c;
			--gold: #c8a96d;
			--shadow: rgba(0, 0, 0, 0.55);
		}
	}

	.book-screen {
		min-height: 100dvh;
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto;
		gap: clamp(0.65rem, 1.4vw, 1.1rem);
		padding: clamp(0.75rem, 2vw, 1.75rem);
		overflow: hidden;
		color: var(--screen-ink);
		background:
			linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px) 0 0 / 26px 26px,
			linear-gradient(0deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px) 0 0 / 26px 26px,
			var(--screen-bg);
		font-family: Georgia, 'Times New Roman', serif;
	}

	.book-status,
	.book-controls {
		width: min(100%, 78rem);
		margin: 0 auto;
		display: grid;
		grid-template-columns: auto minmax(5rem, 1fr) auto;
		align-items: center;
		gap: clamp(0.75rem, 2vw, 1.4rem);
		font-size: clamp(0.72rem, 1.2vw, 0.86rem);
		color: var(--screen-muted);
	}

	.wordmark,
	.book-controls button,
	.inline-link,
	.cover-meta button,
	.press-note button {
		border: 1px solid var(--line);
		background: color-mix(in srgb, var(--paper) 82%, transparent);
		color: inherit;
		font: inherit;
		cursor: pointer;
		transition:
			transform 180ms ease,
			border-color 180ms ease,
			background 180ms ease;
	}

	.wordmark {
		padding: 0.5rem 0.75rem;
		color: var(--screen-ink);
		text-transform: uppercase;
	}

	.page-track {
		height: 1px;
		background: linear-gradient(
			90deg,
			var(--accent) 0 var(--progress),
			color-mix(in srgb, var(--line) 80%, transparent) var(--progress)
		);
	}

	.book-stage {
		position: relative;
		min-height: 0;
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: clamp(0.4rem, 1.3vw, 1rem);
	}

	.book-shadow {
		width: min(100%, calc((100dvh - 9rem) * 1.44), 85rem);
		margin: 0 auto;
		filter: drop-shadow(0 1.6rem 2rem var(--shadow));
	}

	.flipbook {
		width: 100%;
		margin: 0 auto;
	}

	.flipbook:not(.ready) .book-page:not(:first-child) {
		display: none;
	}

	:global(.stf__parent) {
		margin: 0 auto;
	}

	:global(.stf__wrapper) {
		border-radius: 2px;
		overflow: visible;
	}

	:global(.stf__block) {
		border-radius: 2px;
	}

	.book-page {
		position: absolute;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background:
			linear-gradient(
				90deg,
				rgba(0, 0, 0, 0.055),
				transparent 5%,
				transparent 95%,
				rgba(0, 0, 0, 0.08)
			),
			linear-gradient(180deg, rgba(255, 255, 255, 0.18), transparent 16%), var(--paper);
		color: var(--paper-ink);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--line) 72%, transparent);
	}

	:global(.stf__block > .book-page.stf__item) {
		position: absolute;
	}

	.book-page::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background:
			linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px) 0 0 / 13px 13px,
			linear-gradient(0deg, rgba(0, 0, 0, 0.025) 1px, transparent 1px) 0 0 / 13px 13px;
		opacity: 0.5;
		mix-blend-mode: multiply;
	}

	.cover-page,
	.back-cover {
		background: var(--cover);
		color: var(--cover-ink);
		box-shadow:
			inset 0 0 0 1px color-mix(in srgb, var(--cover-ink) 48%, transparent),
			inset 0.9rem 0 1.5rem rgba(0, 0, 0, 0.18);
	}

	.cover-border {
		position: absolute;
		inset: clamp(1rem, 5%, 2.2rem);
		display: grid;
		place-items: center;
		align-content: center;
		gap: clamp(0.65rem, 2vw, 1.1rem);
		padding: clamp(0.85rem, 3vw, 1.5rem);
		border: 2px solid currentColor;
		text-align: center;
	}

	.cover-border img {
		width: min(54%, 11.75rem);
		height: auto;
		display: block;
	}

	.cover-meta {
		display: grid;
		gap: 0.8rem;
		justify-items: center;
		max-width: 27rem;
	}

	.cover-meta p,
	.eyebrow,
	.folio,
	.catalogue-card p,
	.contact-grid span,
	.journal-stack time {
		margin: 0;
		font-family: ui-sans-serif, system-ui, sans-serif;
		text-transform: uppercase;
		font-size: clamp(0.64rem, 1.2vw, 0.76rem);
		color: var(--paper-muted);
	}

	.cover-meta p {
		color: currentColor;
	}

	.page-inner h2 {
		margin: 0;
		font-size: clamp(2rem, 5.6vw, 4.8rem);
		line-height: 0.98;
		font-weight: 500;
		text-wrap: balance;
	}

	.cover-meta h1 {
		margin: 0;
		font-size: clamp(1.65rem, 3.4vw, 2.65rem);
		line-height: 1.04;
		font-weight: 500;
		text-wrap: balance;
	}

	.cover-meta button,
	.inline-link,
	.press-note button {
		padding: 0.72rem 1rem;
		min-height: 2.6rem;
		color: var(--paper-ink);
		background: var(--paper);
	}

	button:hover:not(:disabled) {
		transform: translateY(-1px);
		border-color: var(--accent);
	}

	button:disabled {
		cursor: not-allowed;
		opacity: 0.45;
	}

	.page-inner {
		position: relative;
		z-index: 1;
		height: 100%;
		display: grid;
		align-content: start;
		gap: clamp(0.45rem, 1.15vw, 0.82rem);
		padding: clamp(1rem, 3.2vw, 2.2rem) clamp(1rem, 3.2vw, 2.2rem)
			clamp(2.3rem, 4vw, 3rem);
	}

	.folio {
		position: absolute;
		left: 50%;
		bottom: clamp(0.65rem, 1.5vw, 1rem);
		transform: translateX(-50%);
		justify-self: auto;
	}

	.page-inner h2 {
		font-size: clamp(1.65rem, 3vw, 2.55rem);
		line-height: 1.02;
		color: var(--paper-ink);
	}

	.lead {
		margin: 0;
		max-width: 34rem;
		font-size: clamp(0.9rem, 1.4vw, 1rem);
		line-height: 1.42;
		color: var(--paper-muted);
	}

	.lead.small {
		font-size: clamp(0.95rem, 1.6vw, 1.08rem);
	}

	.contents-list {
		display: grid;
		gap: 0;
		margin-top: clamp(0.2rem, 1vw, 0.5rem);
	}

	.contents-list button {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: baseline;
		gap: 0.08rem 0.75rem;
		padding: clamp(0.3rem, 0.85vw, 0.46rem) 0;
		border: 0;
		border-bottom: 1px solid var(--line);
		background: transparent;
		color: var(--paper-ink);
		text-align: left;
		cursor: pointer;
	}

	.contents-list span {
		font-size: clamp(0.95rem, 1.45vw, 1.12rem);
	}

	.contents-list small {
		grid-column: 1 / -1;
		grid-row: 2;
		font-family: ui-sans-serif, system-ui, sans-serif;
		font-size: clamp(0.61rem, 0.9vw, 0.68rem);
		color: var(--paper-muted);
	}

	.contents-list i {
		grid-column: 2;
		grid-row: 1;
		font-style: normal;
		color: var(--accent);
	}

	.contents-list button[aria-current='page'] {
		color: var(--accent-strong);
	}

	.quote-block {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 0.8rem;
		padding-top: 1rem;
		border-top: 1px solid var(--line);
		color: var(--accent-strong);
	}

	.quote-block span {
		font-size: clamp(2.6rem, 5vw, 3.6rem);
		line-height: 0.8;
	}

	.quote-block p {
		margin: 0;
		font-size: clamp(0.92rem, 1.35vw, 1.05rem);
		line-height: 1.35;
	}

	.inline-link {
		width: fit-content;
		margin-top: 0.35rem;
		color: var(--paper-ink);
	}

	.collection-grid,
	.shelf,
	.contact-grid,
	.journal-stack {
		display: grid;
		gap: clamp(0.48rem, 1vw, 0.72rem);
	}

	.collection-grid section,
	.catalogue-card,
	.journal-stack section,
	.contact-grid a,
	.press-note {
		border: 1px solid var(--line);
		background: color-mix(in srgb, var(--paper) 76%, var(--paper-deep));
	}

	.collection-grid section {
		padding: clamp(0.62rem, 1.4vw, 0.85rem);
	}

	.collection-grid small {
		color: var(--gold);
		font-family: ui-sans-serif, system-ui, sans-serif;
	}

	.collection-grid h3,
	.catalogue-card h3,
	.journal-stack h3 {
		margin: 0.12rem 0;
		font-size: clamp(1.05rem, 1.55vw, 1.28rem);
		line-height: 1.1;
		font-weight: 500;
	}

	.collection-grid p,
	.catalogue-card span,
	.press-note p,
	.author-layout p,
	.manuscript-list,
	.back-cover p {
		margin: 0;
		color: var(--paper-muted);
		font-size: clamp(0.8rem, 1.05vw, 0.94rem);
		line-height: 1.38;
	}

	.shelf {
		grid-template-columns: 1fr;
	}

	.catalogue-card {
		min-height: clamp(4.65rem, 8vw, 5.6rem);
		display: grid;
		align-content: space-between;
		padding: clamp(0.52rem, 1.2vw, 0.7rem);
		border-left: 0.34rem solid var(--accent);
	}

	.catalogue-card p,
	.catalogue-card span,
	.catalogue-card strong {
		font-size: clamp(0.68rem, 1vw, 0.82rem);
	}

	.catalogue-card strong {
		color: var(--accent-strong);
		font-weight: 500;
	}

	.press-note {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.8rem;
		padding: 0.62rem;
		font-size: clamp(0.76rem, 1vw, 0.88rem);
	}

	.press-note button {
		min-height: 2.15rem;
		padding: 0.48rem 0.62rem;
		font-size: 0.78rem;
	}

	.author-layout {
		display: grid;
		grid-template-columns: minmax(4rem, 9rem) minmax(0, 1fr);
		gap: clamp(0.9rem, 2.5vw, 1.5rem);
		align-items: start;
	}

	.initial {
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		border: 1px solid var(--line);
		color: var(--accent);
		font-size: clamp(3.5rem, 12vw, 7rem);
		line-height: 1;
	}

	.manuscript-list {
		display: grid;
		gap: 0.65rem;
		padding-left: 1.4rem;
		font-size: clamp(1rem, 1.8vw, 1.18rem);
	}

	.manuscript-list li::marker {
		color: var(--accent-strong);
	}

	.journal-stack section {
		padding: clamp(0.85rem, 2vw, 1.1rem);
	}

	.contact-grid a {
		display: grid;
		gap: 0.3rem;
		padding: clamp(0.85rem, 2vw, 1rem);
		color: var(--paper-ink);
		text-decoration: none;
		overflow-wrap: anywhere;
	}

	.back-cover .cover-border {
		align-content: space-between;
	}

	.back-cover img {
		width: min(58%, 20rem);
	}

	.back-cover p {
		max-width: 24rem;
		font-size: clamp(1rem, 2vw, 1.35rem);
		color: currentColor;
	}

	.turn-button {
		width: clamp(2.25rem, 4vw, 3rem);
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		border: 1px solid var(--line);
		background: color-mix(in srgb, var(--paper) 78%, transparent);
		color: var(--screen-ink);
		font-size: clamp(1.6rem, 4vw, 2.5rem);
		line-height: 1;
		cursor: pointer;
	}

	.book-controls {
		grid-template-columns: repeat(3, auto) 1fr;
	}

	.book-controls button {
		padding: 0.5rem 0.7rem;
		color: var(--screen-ink);
	}

	.book-controls span {
		justify-self: end;
		color: var(--screen-muted);
	}

	@media (max-width: 880px) {
		.book-screen {
			gap: 0.7rem;
			padding: 0.7rem;
		}

		.book-status {
			grid-template-columns: 1fr auto;
		}

		.book-status .page-track {
			grid-column: 1 / -1;
			order: 3;
		}

		.book-shadow {
			width: min(100%, calc((100dvh - 8.2rem) * 0.72), 30rem);
		}

		.book-stage {
			grid-template-columns: 1fr;
		}

		.turn-button {
			position: absolute;
			z-index: 5;
			top: auto;
			bottom: clamp(0.4rem, 2vw, 0.8rem);
			transform: none;
			background: color-mix(in srgb, var(--paper) 90%, transparent);
		}

		.turn-button:hover:not(:disabled) {
			transform: translateY(-1px);
		}

		.turn-button--prev {
			left: 0;
		}

		.turn-button--next {
			right: 0;
		}

		.shelf {
			grid-template-columns: 1fr;
		}

		.catalogue-card {
			min-height: 7.5rem;
		}
	}

	@media (max-width: 560px) {
		.cover-border {
			inset: 0.75rem;
			padding: 1rem;
		}

		.page-inner {
			padding: 1.05rem 1.05rem 2.55rem;
			gap: 0.65rem;
		}

		.contents-list button {
			grid-template-columns: minmax(0, 1fr) auto;
		}

		.contents-list small {
			grid-column: 1 / -1;
		}

		.press-note,
		.author-layout {
			display: grid;
			grid-template-columns: 1fr;
		}

		.initial {
			width: 5.2rem;
		}

		.book-controls {
			grid-template-columns: repeat(3, 1fr);
		}

		.book-controls span {
			grid-column: 1 / -1;
			justify-self: center;
		}
	}

	@media (max-height: 780px) {
		.contents-list small {
			display: none;
		}

		.contents-list button {
			padding: clamp(0.38rem, 1vw, 0.55rem) 0;
		}

		.catalogue-page .press-note {
			display: none;
		}
	}
</style>
