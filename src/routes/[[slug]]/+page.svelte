<script lang="ts">
	import { browser } from '$app/environment';
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page as routePage } from '$app/state';
	import { tick } from 'svelte';

	type FlipCorner = 'top' | 'bottom';
	type PageFlip = import('page-flip/dist/js/page-flip.module.js').PageFlip;

	const contents = [
		{ title: 'Sommaire', page: 1, note: 'Carte du livre-site' },
		{ title: 'À propos', page: 2, note: 'Création et publication' },
		{ title: 'Catalogue', page: 4, note: 'Livres en vitrine' },
		{ title: 'Auteurs', page: 5, note: 'Voix accompagnées' },
		{ title: 'Manuscrits', page: 6, note: 'Soumettre un texte' },
		{ title: 'Tarifs', page: 7, note: 'Estimation personnalisée' },
		{ title: 'Contact', page: 8, note: 'Libraires, presse, droits' }
	];

	const pageNames = [
		'Couverture',
		'Sommaire',
		'À propos',
		'À propos',
		'Catalogue',
		'Auteurs',
		'Manuscrits',
		'Tarifs',
		'Contact',
		'Dos'
	];

	const slugByPage = [
		'',
		'sommaire',
		'a-propos',
		'a-propos-suite',
		'catalogue',
		'auteurs',
		'manuscrits',
		'tarifs',
		'contact',
		'dos'
	];

	type ProjectType = 'paper' | 'epub' | 'paper-epub';
	type BookCategory = 'fiction' | 'essay' | 'illustrated' | 'youth' | 'poetry' | 'art-book';
	type CoverOption = 'ready-pdf' | 'supplied-illustration' | 'full-creation';
	type PublicationOption = 'kdp' | 'bod' | 'kdp-bod' | 'none';
	type VolumeInput = 'pages' | 'signs';
	type PricingState = {
		projectType: ProjectType;
		bookCategory: BookCategory;
		volumeInput: VolumeInput;
		pageCount: number;
		signCount: number;
		illustrationCount: number;
		wantsCorrection: boolean;
		coverOption: CoverOption;
		hasFootnotes: boolean;
		hasIndex: boolean;
		hasComplexIndex: boolean;
		hasSummary: boolean;
		tableCount: number;
		publicationOption: PublicationOption;
	};

	const projectTypes: { value: ProjectType; label: string }[] = [
		{ value: 'paper', label: 'Livre papier' },
		{ value: 'epub', label: 'Livre numérique (ePub)' },
		{ value: 'paper-epub', label: 'Livre papier + numérique' }
	];

	const bookCategories: { value: BookCategory; label: string }[] = [
		{ value: 'fiction', label: 'Roman / Nouvelle' },
		{ value: 'essay', label: 'Essai / Document' },
		{ value: 'illustrated', label: 'Livre illustré' },
		{ value: 'youth', label: 'Livre jeunesse' },
		{ value: 'poetry', label: 'Recueil de poésie' },
		{ value: 'art-book', label: "Beau livre / Livre d'art" }
	];

	const coverOptions: { value: CoverOption; label: string; price: number }[] = [
		{ value: 'ready-pdf', label: 'PDF complet prêt pour impression', price: 0 },
		{ value: 'supplied-illustration', label: 'Illustration fournie', price: 120 },
		{ value: 'full-creation', label: 'Création complète', price: 180 }
	];

	const publicationOptions: { value: PublicationOption; label: string; price: number }[] = [
		{ value: 'kdp', label: 'KDP', price: 50 },
		{ value: 'bod', label: 'BoD', price: 99 },
		{ value: 'kdp-bod', label: 'KDP + BoD', price: 149 },
		{ value: 'none', label: 'Pas de publication', price: 0 }
	];

	const euroFormatter = new Intl.NumberFormat('fr-FR', {
		style: 'currency',
		currency: 'EUR',
		maximumFractionDigits: 0
	});
	const pricingStorageKey = 'afleurdelignes-pricing-configurator';

	let projectType = $state<ProjectType>('paper');
	let bookCategory = $state<BookCategory>('fiction');
	let volumeInput = $state<VolumeInput>('pages');
	let pageCount = $state(120);
	let signCount = $state(180000);
	let illustrationCount = $state(0);
	let wantsCorrection = $state(true);
	let coverOption = $state<CoverOption>('supplied-illustration');
	let hasFootnotes = $state(false);
	let hasIndex = $state(false);
	let hasComplexIndex = $state(false);
	let hasSummary = $state(true);
	let tableCount = $state(0);
	let publicationOption = $state<PublicationOption>('none');
	let hasLoadedPricingState = $state(false);

	let estimatedPages = $derived(
		Math.max(0, Math.ceil(volumeInput === 'signs' ? signCount / 1500 : pageCount))
	);
	let layoutPrice = $derived(Math.max(90, estimatedPages * 1.5));
	let correctionPrice = $derived(wantsCorrection ? estimatedPages * 1.25 : 0);
	let illustrationsPrice = $derived(Math.max(0, illustrationCount) * 10);
	let tablesPrice = $derived(Math.max(0, tableCount) * 5);
	let footnotesPrice = $derived(hasFootnotes ? 50 : 0);
	let indexPrice = $derived(
		hasIndex ? (estimatedPages <= 100 ? 80 : estimatedPages <= 200 ? 120 : 180) : 0
	);
	let coverPrice = $derived(coverOptions.find((option) => option.value === coverOption)?.price ?? 0);
	let epubPrice = $derived(projectType === 'epub' || projectType === 'paper-epub' ? 75 : 0);
	let epubCoverAdaptationPrice = $derived(
		projectType === 'paper-epub' && coverOption !== 'ready-pdf' ? 30 : 0
	);
	let publicationPrice = $derived(
		publicationOptions.find((option) => option.value === publicationOption)?.price ?? 0
	);
	let requiresQuote = $derived(bookCategory === 'art-book' || (hasIndex && hasComplexIndex));
	let totalEstimate = $derived(
		layoutPrice +
			correctionPrice +
			illustrationsPrice +
			tablesPrice +
			footnotesPrice +
			indexPrice +
			coverPrice +
			epubPrice +
			epubCoverAdaptationPrice +
			publicationPrice
	);

	function formatEuro(amount: number) {
		return euroFormatter.format(amount);
	}

	$effect(() => {
		if (!browser) return;

		const rawState = localStorage.getItem(pricingStorageKey);

		if (rawState) {
			try {
				restorePricingState(JSON.parse(rawState) as Partial<PricingState>);
			} catch {
				localStorage.removeItem(pricingStorageKey);
			}
		}

		hasLoadedPricingState = true;
	});

	$effect(() => {
		const state = {
			projectType,
			bookCategory,
			volumeInput,
			pageCount,
			signCount,
			illustrationCount,
			wantsCorrection,
			coverOption,
			hasFootnotes,
			hasIndex,
			hasComplexIndex,
			hasSummary,
			tableCount,
			publicationOption
		};

		if (!browser || !hasLoadedPricingState) return;

		localStorage.setItem(pricingStorageKey, JSON.stringify(state));
	});

	function restorePricingState(state: Partial<PricingState>) {
		if (isProjectType(state.projectType)) projectType = state.projectType;
		if (isBookCategory(state.bookCategory)) bookCategory = state.bookCategory;
		if (isVolumeInput(state.volumeInput)) volumeInput = state.volumeInput;
		if (typeof state.pageCount === 'number') pageCount = state.pageCount;
		if (typeof state.signCount === 'number') signCount = state.signCount;
		if (typeof state.illustrationCount === 'number') illustrationCount = state.illustrationCount;
		if (typeof state.wantsCorrection === 'boolean') wantsCorrection = state.wantsCorrection;
		if (isCoverOption(state.coverOption)) coverOption = state.coverOption;
		if (typeof state.hasFootnotes === 'boolean') hasFootnotes = state.hasFootnotes;
		if (typeof state.hasIndex === 'boolean') hasIndex = state.hasIndex;
		if (typeof state.hasComplexIndex === 'boolean') hasComplexIndex = state.hasComplexIndex;
		if (typeof state.hasSummary === 'boolean') hasSummary = state.hasSummary;
		if (typeof state.tableCount === 'number') tableCount = state.tableCount;
		if (isPublicationOption(state.publicationOption)) publicationOption = state.publicationOption;
	}

	function isProjectType(value: unknown): value is ProjectType {
		return projectTypes.some((option) => option.value === value);
	}

	function isBookCategory(value: unknown): value is BookCategory {
		return bookCategories.some((option) => option.value === value);
	}

	function isCoverOption(value: unknown): value is CoverOption {
		return coverOptions.some((option) => option.value === value);
	}

	function isPublicationOption(value: unknown): value is PublicationOption {
		return publicationOptions.some((option) => option.value === value);
	}

	function isVolumeInput(value: unknown): value is VolumeInput {
		return value === 'pages' || value === 'signs';
	}

	function stopPricingEvent(event: Event) {
		event.stopPropagation();
	}

	function containPricingInteraction(node: HTMLElement) {
		const options = { capture: true };
		const eventNames = [
			'click',
			'dblclick',
			'mousedown',
			'mouseup',
			'pointerdown',
			'pointerup',
			'touchstart',
			'touchend',
			'keydown',
			'keyup',
			'wheel'
		];

		for (const eventName of eventNames) {
			node.addEventListener(eventName, stopPricingEvent, options);
		}

		return {
			destroy() {
				for (const eventName of eventNames) {
					node.removeEventListener(eventName, stopPricingEvent, options);
				}
			}
		};
	}

	const catalogue = [
		{
			title: 'Plume et ses compagnons',
			author: 'Marc BAUDRILLARD',
			tag: 'Livre pour enfants',
			status: 'Déjà en librairie'
		},
		{
			title: 'Nouvelles Augmentées',
			author: 'Guillaume DARBONNE',
			tag: 'Science-fiction',
			status: 'Bientôt'
		},
		{
			title: 'Le vert',
			author: 'Céline VASSEUR',
			tag: 'Art et nature',
			status: 'Bientôt'
		}
	];

	const manuscriptSteps = [
		'Un synopsis d’une page',
		'Trois chapitres ou trente pages',
		'Une note d’intention',
		'Coordonnées et bibliographie courte'
	];

	const aboutParagraphs = [
		'A fleur de lignes est né d’une volonté simple : rendre la création et la publication d’un livre accessibles aux auteurs tout en conservant un niveau de qualité professionnel.',
		"Depuis plusieurs années, j'accompagne des projets éditoriaux à travers la création de couvertures, la mise en page, la préparation des fichiers pour l’impression et la publication. À ce jour, j’ai participé à la réalisation d’une cinquantaine d’ouvrages en collaboration avec leurs auteurs ainsi qu’avec une maison d’édition indépendante.",
		'Mon parcours m’a également permis de découvrir le livre sous un autre angle grâce à près de dix années d’expérience en librairie. Cette double approche me donne une vision globale de la chaîne du livre, de sa conception jusqu’à sa rencontre avec les lecteurs.'
	];

	const aboutMoreParagraphs = [
		'Au fil des projets, j’ai constaté les difficultés rencontrées par de nombreux auteurs : manque de réponses des maisons d’édition, démarches techniques complexes, délais importants ou absence d’accompagnement personnalisé.',
		'C’est pour répondre à ces besoins qu’est né A fleur de lignes.',
		'J’accompagne aujourd’hui les auteurs et porteurs de projets à chaque étape de leur publication : mise en page, préparation des illustrations, création de couverture, contrôle des fichiers d’impression, création de livres numériques EPUB et publication sur les plateformes KDP et BoD.',
		'Chaque projet est unique et bénéficie d’un suivi attentif, avec une approche à la fois humaine, rigoureuse et artisanale.',
		'Parce qu’un livre ne se résume pas à un simple fichier, chaque projet mérite une attention particulière pour devenir un ouvrage dont son auteur peut être fier.'
	];

	const initialPage = pageIndexFromSlug(routePage.params.slug);

	let bookElement = $state<HTMLDivElement | undefined>();
	let pageFlip: PageFlip | null = null;
	let isReady = $state(false);
	let currentPage = $state(initialPage);
	let totalPages = $state(pageNames.length);
	let orientation = $state<'portrait' | 'landscape'>('landscape');
	let initialSlugPage: number | null = initialPage > 0 ? initialPage : null;
	let urlPageOverride: number | null = initialPage > 0 ? initialPage : null;

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
				startPage: initialPage,
				mobileScrollSupport: true,
				swipeDistance: 35,
				clickEventForward: false,
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
				replaceUrlForPage(currentPage);
			});

			pageFlip.on('flip', (event) => {
				const flippedPage =
					typeof event.data === 'number' ? event.data : (pageFlip?.getCurrentPageIndex() ?? 0);
				currentPage = urlPageOverride ?? initialSlugPage ?? flippedPage;
				replaceUrlForPage(currentPage);
				urlPageOverride = null;
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

		initialSlugPage = null;
		urlPageOverride = page;
		pageFlip.flip(page, corner);
	}

	function goHome() {
		initialSlugPage = null;
		urlPageOverride = 0;
		replaceUrlForPage(0);

		if (pageFlip && currentPage !== 0) {
			pageFlip.flip(0, 'top');
		}
	}

	function navigateInsidePage(event: MouseEvent, page: number, corner: FlipCorner = 'bottom') {
		event.preventDefault();
		event.stopPropagation();
		flipTo(page, corner);
	}

	function nextPage() {
		initialSlugPage = null;
		pageFlip?.flipNext('bottom');
	}

	function previousPage() {
		initialSlugPage = null;
		pageFlip?.flipPrev('bottom');
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowRight') nextPage();
		if (event.key === 'ArrowLeft') previousPage();
	}

	function pageIndexFromSlug(slug: string | undefined) {
		if (!slug) return 0;

		const index = slugByPage.indexOf(slug);
		return index >= 0 ? index : 0;
	}

	function pagePath(pageIndex: number) {
		const slug = slugByPage[pageIndex] ?? '';
		return slug ? `/${slug}` : '/';
	}

	function replaceUrlForPage(pageIndex: number) {
		const path = pagePath(pageIndex);

		if (routePage.url.pathname !== path) {
			replaceState(resolve(path), routePage.state);
		}
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
		<button class="wordmark" type="button" onclick={goHome}>À Fleur de Lignes</button>
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
							<button
								type="button"
								onclick={(event) => navigateInsidePage(event, 1)}
								disabled={!isReady}>Ouvrir le livre</button
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
									onclick={(event) => navigateInsidePage(event, entry.page)}
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

				<article class="book-page manifesto-page" aria-label="À propos">
					<div class="page-inner">
						<p class="folio">3</p>
						<p class="eyebrow">À propos</p>
						<h2>Créer des livres avec exigence et attention.</h2>
						<div class="about-copy">
							{#each aboutParagraphs as paragraph (paragraph)}
								<p>{paragraph}</p>
							{/each}
						</div>
						<button
							class="inline-link"
							type="button"
							onclick={(event) => navigateInsidePage(event, 3)}>Lire la suite</button
						>
					</div>
				</article>

				<article class="book-page manifesto-page" aria-label="À propos, suite">
					<div class="page-inner">
						<p class="folio">4</p>
						<p class="eyebrow">À propos</p>
						<h2>Un accompagnement éditorial à chaque étape.</h2>
						<div class="about-copy">
							{#each aboutMoreParagraphs as paragraph (paragraph)}
								<p>{paragraph}</p>
							{/each}
						</div>
						<button
							class="inline-link"
							type="button"
							onclick={(event) => navigateInsidePage(event, 4)}>Feuilleter le catalogue</button
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
							<button type="button" onclick={(event) => navigateInsidePage(event, 8)}
								>Aller au contact</button
							>
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
						<button
							class="inline-link"
							type="button"
							onclick={(event) => navigateInsidePage(event, 6)}>Soumettre un manuscrit</button
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
						<button
							class="inline-link"
							type="button"
							onclick={(event) => navigateInsidePage(event, 7)}>Estimer un projet</button
						>
					</div>
				</article>

				<article
					class="book-page pricing-page"
					aria-label="Tarifs"
					use:containPricingInteraction
				>
					<div class="page-inner pricing-inner">
						<p class="folio">8</p>
						<p class="eyebrow">Tarifs</p>
						<div class="pricing-header">
							<div>
								<h2>Configurateur auteur</h2>
								<p class="lead">
									Sélectionnez les prestations dont vous avez besoin. Le calcul donne une
									estimation personnalisée, sans engagement.
								</p>
							</div>
							<aside class="estimate-box" aria-live="polite">
								<span>{requiresQuote ? 'Sur devis' : 'Estimation'}</span>
								<strong>{requiresQuote ? 'À préciser' : formatEuro(totalEstimate)}</strong>
								<small>{estimatedPages} page{estimatedPages > 1 ? 's' : ''} A4 estimée{estimatedPages > 1 ? 's' : ''}</small>
							</aside>
						</div>

							<form
								class="pricing-scroll"
								use:containPricingInteraction
								onsubmit={(event) => event.preventDefault()}
							>
							<section class="pricing-group">
								<h3>Projet</h3>
								<div class="option-grid">
									{#each projectTypes as option (option.value)}
										<label>
											<input type="radio" bind:group={projectType} value={option.value} />
											<span>{option.label}</span>
										</label>
									{/each}
								</div>
							</section>

							<section class="pricing-group">
								<h3>Catégorie</h3>
								<select bind:value={bookCategory}>
									{#each bookCategories as option (option.value)}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							</section>

							<section class="pricing-group">
								<h3>Volume</h3>
								<div class="volume-grid">
									<label>
										<span>Base</span>
										<select bind:value={volumeInput}>
											<option value="pages">Pages A4</option>
											<option value="signs">Signes espaces comprises</option>
										</select>
									</label>
									{#if volumeInput === 'pages'}
										<label>
											<span>Pages A4</span>
											<input type="number" min="0" step="1" bind:value={pageCount} />
										</label>
									{:else}
										<label>
											<span>Signes</span>
											<input type="number" min="0" step="1000" bind:value={signCount} />
										</label>
									{/if}
								</div>
							</section>

							<section class="pricing-group">
								<h3>Prestations</h3>
								<div class="toggle-grid">
									<label><input type="checkbox" bind:checked={wantsCorrection} /> Correction</label>
									<label><input type="checkbox" bind:checked={hasFootnotes} /> Notes de bas de page</label>
									<label><input type="checkbox" bind:checked={hasIndex} /> Index</label>
									<label><input type="checkbox" bind:checked={hasSummary} /> Sommaire inclus</label>
									{#if hasIndex}
										<label><input type="checkbox" bind:checked={hasComplexIndex} /> Index complexe</label>
									{/if}
								</div>
							</section>

							<section class="pricing-group compact-fields">
								<label>
									<span>Illustrations</span>
									<input type="number" min="0" step="1" bind:value={illustrationCount} />
								</label>
								<label>
									<span>Tableaux</span>
									<input type="number" min="0" step="1" bind:value={tableCount} />
								</label>
							</section>

							<section class="pricing-group">
								<h3>Couverture</h3>
								<select bind:value={coverOption}>
									{#each coverOptions as option (option.value)}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							</section>

							<section class="pricing-group">
								<h3>Publication</h3>
								<select bind:value={publicationOption}>
									{#each publicationOptions as option (option.value)}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							</section>

							<section class="pricing-group breakdown">
								<h3>Détail</h3>
								<dl>
									<div><dt>Mise en page</dt><dd>{formatEuro(layoutPrice)}</dd></div>
									<div><dt>Correction</dt><dd>{formatEuro(correctionPrice)}</dd></div>
									<div><dt>Illustrations</dt><dd>{formatEuro(illustrationsPrice)}</dd></div>
									<div><dt>Tableaux</dt><dd>{formatEuro(tablesPrice)}</dd></div>
									<div><dt>Notes</dt><dd>{formatEuro(footnotesPrice)}</dd></div>
									<div><dt>Index</dt><dd>{formatEuro(indexPrice)}</dd></div>
									<div><dt>Couverture</dt><dd>{formatEuro(coverPrice)}</dd></div>
									<div><dt>ePub</dt><dd>{formatEuro(epubPrice + epubCoverAdaptationPrice)}</dd></div>
									<div><dt>Publication</dt><dd>{formatEuro(publicationPrice)}</dd></div>
								</dl>
							</section>
							</form>
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
						<button
							class="inline-link"
							type="button"
							onclick={(event) => navigateInsidePage(event, 0, 'top')}>Retour couverture</button
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
		<button type="button" onclick={() => flipTo(7)} disabled={!isReady}>Tarifs</button>
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

	.cover-page .cover-border {
		align-content: start;
		gap: clamp(0.5rem, 1.4vw, 0.8rem);
		padding-top: clamp(0.9rem, 2.4vw, 1.7rem);
	}

	.cover-page picture {
		display: grid;
		justify-items: center;
		width: 100%;
	}

	.cover-page .cover-border img {
		width: min(82%, 20rem);
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
	.estimate-box span,
	.estimate-box small,
	.pricing-group h3,
	.pricing-group label > span {
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

	.book-page button > *,
	.book-page a > * {
		pointer-events: none;
	}

	.page-inner {
		position: relative;
		z-index: 1;
		height: 100%;
		display: grid;
		align-content: start;
		gap: clamp(0.45rem, 1.15vw, 0.82rem);
		padding: clamp(1rem, 3.2vw, 2.2rem) clamp(1rem, 3.2vw, 2.2rem) clamp(2.3rem, 4vw, 3rem);
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

	.manifesto-page .page-inner {
		gap: clamp(0.52rem, 1vw, 0.78rem);
	}

	.manifesto-page h2 {
		font-size: clamp(1.55rem, 2.75vw, 2.35rem);
	}

	.about-copy {
		display: grid;
		gap: clamp(0.58rem, 1vw, 0.82rem);
	}

	.about-copy p {
		margin: 0;
		color: var(--paper-muted);
		font-size: clamp(0.9rem, 1.28vw, 1.08rem);
		line-height: 1.5;
		text-align: justify;
		text-align-last: left;
		hyphens: auto;
	}

	.inline-link {
		width: fit-content;
		margin-top: 0.35rem;
		color: var(--paper-ink);
	}

	.shelf,
	.contact-grid,
	.pricing-scroll,
	.pricing-group,
	.breakdown dl {
		display: grid;
		gap: clamp(0.48rem, 1vw, 0.72rem);
	}

	.catalogue-card,
	.contact-grid a,
	.press-note,
	.estimate-box,
	.pricing-group {
		border: 1px solid var(--line);
		background: color-mix(in srgb, var(--paper) 76%, var(--paper-deep));
	}

	.catalogue-card h3 {
		margin: 0.12rem 0;
		font-size: clamp(1.05rem, 1.55vw, 1.28rem);
		line-height: 1.1;
		font-weight: 500;
	}

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

	.contact-grid a {
		display: grid;
		gap: 0.3rem;
		padding: clamp(0.85rem, 2vw, 1rem);
		color: var(--paper-ink);
		text-decoration: none;
		overflow-wrap: anywhere;
	}

	.pricing-inner {
		grid-template-rows: auto auto minmax(0, 1fr);
		padding-bottom: clamp(1.35rem, 3vw, 2.2rem);
		gap: 0.42rem;
	}

	.pricing-header {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.42rem;
		align-items: stretch;
	}

	.pricing-header h2 {
		font-size: clamp(1.12rem, 1.9vw, 1.55rem);
		line-height: 1;
	}

	.pricing-header .lead {
		margin-top: 0.26rem;
		font-size: clamp(0.7rem, 0.9vw, 0.78rem);
		line-height: 1.25;
	}

	.estimate-box {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.45rem;
		padding: 0.5rem 0.62rem;
		border-left: 0.34rem solid var(--accent-strong);
	}

	.estimate-box strong {
		font-size: clamp(1.12rem, 2vw, 1.45rem);
		line-height: 1;
		font-weight: 500;
		color: var(--accent-strong);
	}

	.estimate-box small {
		margin-left: auto;
		text-transform: none;
		line-height: 1.2;
		text-align: right;
	}

	.pricing-scroll {
		min-height: 0;
		overflow: auto;
		padding-right: 0.28rem;
		scrollbar-width: thin;
	}

	.pricing-group {
		padding: clamp(0.56rem, 1.2vw, 0.76rem);
	}

	.pricing-group h3 {
		font-weight: 700;
		color: var(--paper-ink);
	}

	.option-grid,
	.toggle-grid,
	.volume-grid,
	.compact-fields {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.48rem;
	}

	.option-grid label,
	.toggle-grid label,
	.volume-grid label,
	.compact-fields label {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		min-height: 2.25rem;
		color: var(--paper-ink);
		font-family: ui-sans-serif, system-ui, sans-serif;
		font-size: clamp(0.72rem, 1vw, 0.84rem);
		line-height: 1.18;
	}

	.volume-grid label,
	.compact-fields label {
		display: grid;
		align-items: start;
	}

	.pricing-group input,
	.pricing-group select {
		width: 100%;
		min-height: 2.25rem;
		border: 1px solid var(--line);
		border-radius: 0;
		background: var(--paper);
		color: var(--paper-ink);
		font-family: ui-sans-serif, system-ui, sans-serif;
		font-size: 0.86rem;
	}

	.pricing-group input[type='radio'],
	.pricing-group input[type='checkbox'] {
		position: relative;
		width: 1.05rem;
		height: 1.05rem;
		min-height: 1.05rem;
		flex: 0 0 auto;
		appearance: none;
		border: 1.5px solid color-mix(in srgb, var(--paper-ink) 58%, transparent);
		background: color-mix(in srgb, var(--paper) 88%, white);
		box-shadow: inset 0 0 0 2px var(--paper);
		cursor: pointer;
	}

	.pricing-group input[type='radio'] {
		border-radius: 50%;
	}

	.pricing-group input[type='checkbox']:checked,
	.pricing-group input[type='radio']:checked {
		border-color: var(--accent-strong);
		background: var(--accent-strong);
	}

	.pricing-group input[type='checkbox']:checked::after {
		content: '';
		position: absolute;
		left: 0.3rem;
		top: 0.12rem;
		width: 0.35rem;
		height: 0.62rem;
		border: solid var(--paper);
		border-width: 0 0.13rem 0.13rem 0;
		transform: rotate(45deg);
	}

	.pricing-group input[type='radio']:checked::after {
		content: '';
		position: absolute;
		inset: 0.27rem;
		border-radius: 50%;
		background: var(--paper);
	}

	.pricing-group input[type='checkbox']:focus-visible,
	.pricing-group input[type='radio']:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 2px;
	}

	.breakdown dl {
		margin: 0;
	}

	.breakdown div {
		display: flex;
		justify-content: space-between;
		gap: 0.8rem;
		border-bottom: 1px solid color-mix(in srgb, var(--line) 72%, transparent);
		font-family: ui-sans-serif, system-ui, sans-serif;
		font-size: clamp(0.72rem, 1vw, 0.84rem);
	}

	.breakdown dt,
	.breakdown dd {
		margin: 0;
	}

	.breakdown dd {
		color: var(--accent-strong);
		font-weight: 700;
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

		.manifesto-page .page-inner {
			gap: 0.45rem;
		}

		.manifesto-page h2 {
			font-size: 1.28rem;
		}

		.about-copy {
			gap: 0.4rem;
		}

		.about-copy p {
			font-size: 0.82rem;
			line-height: 1.34;
		}

		.manifesto-page .inline-link {
			display: none;
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
