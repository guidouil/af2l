<script lang="ts">
	import { browser } from '$app/environment';
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page as routePage } from '$app/state';
	import { tick, untrack } from 'svelte';
	import type { PageProps } from './$types';
	import type { PageBlock, PublishedPage } from '$lib/content/types';
	import { calculatePricing } from '$lib/pricing/engine';
	import type {
		BookCategory,
		CoverOption,
		PricingInput,
		ProjectType,
		PublicationOption,
		VolumeInput
	} from '$lib/pricing/types';

	type FlipCorner = 'top' | 'bottom';
	type PageFlip = import('page-flip/dist/js/page-flip.module.js').PageFlip;

	let { data }: PageProps = $props();

	const euroFormatter = new Intl.NumberFormat('fr-FR', {
		style: 'currency',
		currency: 'EUR',
		maximumFractionDigits: 0
	});
	const pricingStorageKey = 'afleurdelignes-pricing-configurator';
	const initialPage = untrack(() => data.initialPage);

	let bookElement = $state<HTMLDivElement | undefined>();
	let pageFlip: PageFlip | null = null;
	let isReady = $state(false);
	let currentPage = $state(initialPage);
	let totalPages = $state(untrack(() => data.book.pages.length));
	let orientation = $state<'portrait' | 'landscape'>('landscape');
	let initialSlugPage: number | null = initialPage > 0 ? initialPage : null;
	let urlPageOverride: number | null = initialPage > 0 ? initialPage : null;

	let projectType = $state<ProjectType>(untrack(() => data.pricing.defaults.projectType));
	let bookCategory = $state<BookCategory>(untrack(() => data.pricing.defaults.bookCategory));
	let volumeInput = $state<VolumeInput>(untrack(() => data.pricing.defaults.volumeInput));
	let pageCount = $state(untrack(() => data.pricing.defaults.pageCount));
	let signCount = $state(untrack(() => data.pricing.defaults.signCount));
	let illustrationCount = $state(untrack(() => data.pricing.defaults.illustrationCount));
	let wantsCorrection = $state(untrack(() => data.pricing.defaults.wantsCorrection));
	let coverOption = $state<CoverOption>(untrack(() => data.pricing.defaults.coverOption));
	let hasFootnotes = $state(untrack(() => data.pricing.defaults.hasFootnotes));
	let hasIndex = $state(untrack(() => data.pricing.defaults.hasIndex));
	let hasComplexIndex = $state(untrack(() => data.pricing.defaults.hasComplexIndex));
	let hasSummary = $state(untrack(() => data.pricing.defaults.hasSummary));
	let tableCount = $state(untrack(() => data.pricing.defaults.tableCount));
	let publicationOption = $state<PublicationOption>(
		untrack(() => data.pricing.defaults.publicationOption)
	);
	let hasLoadedPricingState = $state(false);

	let pages = $derived(data.book.pages);
	let contents = $derived(
		pages
			.map((page, index) => ({ page, index }))
			.filter((entry) => entry.page.showInNav)
			.map((entry) => ({
				title: entry.page.navLabel,
				page: entry.index,
				note: entry.page.navNote
			}))
	);
	let currentLabel = $derived(pages[currentPage]?.navLabel ?? 'Page');
	let progress = $derived(Math.max(0, Math.min(100, ((currentPage + 1) / totalPages) * 100)));
	let pricingInput = $derived<PricingInput>({
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
	});
	let pricingResult = $derived(calculatePricing(data.pricing, pricingInput));

	$effect(() => {
		if (!browser) return;

		const rawState = localStorage.getItem(pricingStorageKey);

		if (rawState) {
			try {
				restorePricingState(JSON.parse(rawState) as Partial<PricingInput>);
			} catch {
				localStorage.removeItem(pricingStorageKey);
			}
		}

		hasLoadedPricingState = true;
	});

	$effect(() => {
		if (!browser || !hasLoadedPricingState) return;
		localStorage.setItem(pricingStorageKey, JSON.stringify(pricingInput));
	});

	$effect(() => {
		const element = bookElement;
		if (!element) return;

		let cancelled = false;

		async function setupFlipbook(target: HTMLDivElement) {
			await tick();

			const { PageFlip } = await import('page-flip/dist/js/page-flip.module.js');
			if (cancelled) return;

			const htmlPages = target.querySelectorAll<HTMLElement>('.book-page');
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
				const eventData = event.data as { page?: number; mode?: 'portrait' | 'landscape' };
				currentPage =
					typeof eventData.page === 'number'
						? eventData.page
						: (pageFlip?.getCurrentPageIndex() ?? 0);
				orientation = eventData.mode ?? pageFlip?.getOrientation() ?? 'landscape';
				totalPages = pageFlip?.getPageCount() ?? htmlPages.length;
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
				if (event.data === 'portrait' || event.data === 'landscape') orientation = event.data;
			});

			pageFlip.loadFromHTML(htmlPages);
		}

		void setupFlipbook(element);

		return () => {
			cancelled = true;
			pageFlip?.destroy();
			pageFlip = null;
		};
	});

	function restorePricingState(state: Partial<PricingInput>) {
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
		return data.pricing.projectTypes.some((option) => option.value === value);
	}

	function isBookCategory(value: unknown): value is BookCategory {
		return data.pricing.bookCategories.some((option) => option.value === value);
	}

	function isCoverOption(value: unknown): value is CoverOption {
		return data.pricing.coverOptions.some((option) => option.value === value);
	}

	function isPublicationOption(value: unknown): value is PublicationOption {
		return data.pricing.publicationOptions.some((option) => option.value === value);
	}

	function isVolumeInput(value: unknown): value is VolumeInput {
		return value === 'pages' || value === 'signs';
	}

	function stopPricingEvent(event: Event) {
		event.stopPropagation();
	}

	function containPricingInteraction(node: HTMLElement) {
		const options: AddEventListenerOptions = { capture: true, passive: true };
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
			'keyup'
		];

		for (const eventName of eventNames) node.addEventListener(eventName, stopPricingEvent, options);

		return {
			destroy() {
				for (const eventName of eventNames)
					node.removeEventListener(eventName, stopPricingEvent, options);
			}
		};
	}

	function formatEuro(amount: number) {
		return euroFormatter.format(amount);
	}

	function pageIndexFromSlug(slug: string | undefined) {
		if (!slug) return homePageIndex();
		const index = pages.findIndex((page) => page.slug === slug);
		return index >= 0 ? index : homePageIndex();
	}

	function pagePath(pageIndex: number) {
		if (pageIndex === homePageIndex()) return '/';
		const slug = pages[pageIndex]?.slug ?? '';
		return slug ? `/${slug}` : '/';
	}

	function homePageIndex() {
		const rootSlugIndex = pages.findIndex((page) => page.slug === '');
		if (rootSlugIndex >= 0) return rootSlugIndex;

		const coverIndex = pages.findIndex((page) => page.kind === 'cover');
		return coverIndex >= 0 ? coverIndex : 0;
	}

	function pageIndexForTarget(slug: string | undefined) {
		return pageIndexFromSlug(slug);
	}

	function replaceUrlForPage(pageIndex: number) {
		const path = pagePath(pageIndex);
		if (routePage.url.pathname !== path) replaceState(resolve(path), routePage.state);
	}

	function flipTo(page: number, corner: FlipCorner = 'bottom') {
		if (!pageFlip || page === currentPage) return;
		initialSlugPage = null;
		urlPageOverride = page;
		pageFlip.flip(page, corner);
	}

	function navigateInsidePage(event: MouseEvent, page: number, corner: FlipCorner = 'bottom') {
		event.preventDefault();
		event.stopPropagation();
		flipTo(page, corner);
	}

	function goHome() {
		const targetPage = homePageIndex();

		initialSlugPage = null;
		urlPageOverride = targetPage;
		replaceUrlForPage(targetPage);
		if (pageFlip && currentPage !== targetPage) pageFlip.flip(targetPage, 'top');
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

	function pageClass(page: PublishedPage) {
		if (page.kind === 'cover') return 'cover-page';
		if (page.kind === 'back_cover') return 'back-cover';
		if (page.blocks.some((block) => block.type === 'pricingConfigurator')) return 'pricing-page';
		return 'content-page';
	}

	function blockImageSource(block: Extract<PageBlock, { type: 'image' }>) {
		if (block.mediaId) return `/media/${block.mediaId}`;
		return block.src ?? '';
	}

	function isInternalHref(href: string) {
		return href.startsWith('/');
	}

	function openExternalHref(href: string) {
		window.location.href = href;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<main class="book-screen">
	<header class="book-status" aria-label="Position dans le livre">
		<button class="wordmark" type="button" onclick={goHome}>{data.book.settings.siteName}</button>
		<div class="page-track" aria-hidden="true" style={`--progress: ${progress}%`}></div>
		<span>{currentLabel}</span>
	</header>

	<section
		class="book-stage"
		aria-label="Livre interactif À fleur de lignes"
		data-orientation={orientation}
	>
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
				aria-roledescription="livre interactif"
			>
				{#each pages as bookPage, pageIndex (bookPage.id)}
					<article
						class={`book-page ${pageClass(bookPage)}`}
						data-density={bookPage.kind === 'cover' || bookPage.kind === 'back_cover'
							? 'hard'
							: undefined}
						aria-label={bookPage.title}
					>
						{#if bookPage.kind === 'cover'}
							<div class="cover-border">
								<picture>
									<source
										srcset={data.book.settings.coverLogoDark}
										media="(prefers-color-scheme: dark)"
									/>
									<img src={data.book.settings.coverLogoLight} alt={data.book.settings.siteName} />
								</picture>
								{#each bookPage.blocks as block (block.id)}
									{@render renderBlock(block)}
								{/each}
							</div>
						{:else if bookPage.kind === 'back_cover'}
							<div class="cover-border">
								<picture>
									<source
										srcset={data.book.settings.coverLogoDark}
										media="(prefers-color-scheme: dark)"
									/>
									<img src={data.book.settings.coverLogoLight} alt={data.book.settings.siteName} />
								</picture>
								{#each bookPage.blocks as block (block.id)}
									{@render renderBlock(block)}
								{/each}
							</div>
						{:else if bookPage.slug === 'sommaire'}
							<div class="page-inner">
								<p class="folio">{pageIndex + 1}</p>
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
						{:else}
							<div class="page-inner">
								<p class="folio">{pageIndex + 1}</p>
								{#each bookPage.blocks as block (block.id)}
									{@render renderBlock(block)}
								{/each}
							</div>
						{/if}
					</article>
				{/each}
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
		{#each contents.slice(0, 3) as entry (entry.title)}
			<button type="button" onclick={() => flipTo(entry.page)} disabled={!isReady}
				>{entry.title}</button
			>
		{/each}
		<span>{String(currentPage + 1).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}</span>
	</footer>
</main>

{#snippet renderBlock(block: PageBlock)}
	{#if block.type === 'hero'}
		<div class="cover-meta">
			{#if block.eyebrow}<p>{block.eyebrow}</p>{/if}
			<h1>{block.title}</h1>
			{#if block.body}<p class="lead">{block.body}</p>{/if}
			{#if block.buttonLabel}
				<button
					type="button"
					onclick={(event) => navigateInsidePage(event, pageIndexForTarget(block.targetSlug))}
					disabled={!isReady}
				>
					{block.buttonLabel}
				</button>
			{/if}
		</div>
	{:else if block.type === 'paragraphs'}
		<section class="copy-block">
			{#if block.eyebrow}<p class="eyebrow">{block.eyebrow}</p>{/if}
			{#if block.title}<h2>{block.title}</h2>{/if}
			<div class="about-copy">
				{#each block.paragraphs as paragraph (paragraph)}
					<p>{paragraph}</p>
				{/each}
			</div>
		</section>
	{:else if block.type === 'list'}
		<section class="copy-block">
			{#if block.eyebrow}<p class="eyebrow">{block.eyebrow}</p>{/if}
			<h2>{block.title}</h2>
			<ol class="manuscript-list">
				{#each block.items as item (item)}
					<li>{item}</li>
				{/each}
			</ol>
			{#if block.intro}<p class="lead small">{block.intro}</p>{/if}
		</section>
	{:else if block.type === 'catalogueCards'}
		<section class="copy-block">
			{#if block.eyebrow}<p class="eyebrow">{block.eyebrow}</p>{/if}
			<h2>{block.title}</h2>
			<div class="shelf">
				{#each block.cards as card (card.title)}
					<section class="catalogue-card">
						<p>{card.tag}</p>
						<h3>{card.title}</h3>
						<span>{card.author}</span>
						<strong>{card.status}</strong>
					</section>
				{/each}
			</div>
			{#if block.note}
				<div class="press-note">
					<p>{block.note}</p>
					{#if block.ctaLabel}
						<button
							type="button"
							onclick={(event) => navigateInsidePage(event, pageIndexForTarget(block.targetSlug))}
						>
							{block.ctaLabel}
						</button>
					{/if}
				</div>
			{/if}
		</section>
	{:else if block.type === 'contactLinks'}
		<section class="copy-block">
			{#if block.eyebrow}<p class="eyebrow">{block.eyebrow}</p>{/if}
			<h2>{block.title}</h2>
			<div class="contact-grid">
				{#each block.links as link (link.href)}
					{#if isInternalHref(link.href)}
						<a href={resolve(link.href)}>
							<span>{link.label}</span>
							{link.text}
						</a>
					{:else}
						<button type="button" class="contact-link" onclick={() => openExternalHref(link.href)}>
							<span>{link.label}</span>
							{link.text}
						</button>
					{/if}
				{/each}
			</div>
			{#if block.ctaLabel}
				<button
					class="inline-link"
					type="button"
					onclick={(event) =>
						navigateInsidePage(event, pageIndexForTarget(block.targetSlug), 'top')}
				>
					{block.ctaLabel}
				</button>
			{/if}
		</section>
	{:else if block.type === 'pricingConfigurator'}
		<section class="pricing-inner">
			<p class="eyebrow">{block.eyebrow ?? 'Tarifs'}</p>
			<div class="pricing-header">
				<div>
					<h2>{block.title}</h2>
					<p class="lead">{block.lead}</p>
				</div>
				<aside class="estimate-box" aria-live="polite">
					<span>{pricingResult.requiresQuote ? 'Sur devis' : 'Estimation'}</span>
					<strong
						>{pricingResult.requiresQuote ? 'À préciser' : formatEuro(pricingResult.total)}</strong
					>
					<small>
						{pricingResult.estimatedPages} page{pricingResult.estimatedPages > 1 ? 's' : ''} A4 estimée{pricingResult.estimatedPages >
						1
							? 's'
							: ''}
					</small>
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
						{#each data.pricing.projectTypes as option (option.value)}
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
						{#each data.pricing.bookCategories as option (option.value)}
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
						<label><input type="checkbox" bind:checked={hasFootnotes} /> Notes de bas de page</label
						>
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
						{#each data.pricing.coverOptions as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</section>

				<section class="pricing-group">
					<h3>Publication</h3>
					<select bind:value={publicationOption}>
						{#each data.pricing.publicationOptions as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</section>

				<section class="pricing-group breakdown">
					<h3>Détail</h3>
					<dl>
						{#each pricingResult.breakdown as item (item.key)}
							<div>
								<dt>{item.label}</dt>
								<dd>{formatEuro(item.amount)}</dd>
							</div>
						{/each}
					</dl>
				</section>
			</form>
		</section>
	{:else if block.type === 'image' && blockImageSource(block)}
		<figure class="image-block">
			<img src={blockImageSource(block)} alt={block.alt} />
			{#if block.caption}<figcaption>{block.caption}</figcaption>{/if}
		</figure>
	{:else if block.type === 'cta'}
		<button
			class="inline-link"
			type="button"
			onclick={(event) => navigateInsidePage(event, pageIndexForTarget(block.targetSlug))}
		>
			{block.label}
		</button>
	{/if}
{/snippet}

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
		width: min(82%, 20rem);
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
		gap: clamp(0.52rem, 1vw, 0.78rem);
		padding: clamp(1rem, 3.2vw, 2.2rem) clamp(1rem, 3.2vw, 2.2rem) clamp(2.3rem, 4vw, 3rem);
	}

	.folio {
		position: absolute;
		left: 50%;
		bottom: clamp(0.65rem, 1.5vw, 1rem);
		transform: translateX(-50%);
	}

	h2,
	.page-inner h2 {
		margin: 0;
		font-size: clamp(1.55rem, 2.75vw, 2.35rem);
		line-height: 1.02;
		font-weight: 500;
		color: var(--paper-ink);
		text-wrap: balance;
	}

	.lead {
		margin: 0;
		max-width: 34rem;
		font-size: clamp(0.9rem, 1.4vw, 1rem);
		line-height: 1.42;
		color: var(--paper-muted);
	}

	.copy-block,
	.about-copy,
	.shelf,
	.contact-grid,
	.pricing-scroll,
	.pricing-group,
	.breakdown dl {
		display: grid;
		gap: clamp(0.48rem, 1vw, 0.72rem);
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

	.contents-list small {
		grid-column: 1 / -1;
		font-family: ui-sans-serif, system-ui, sans-serif;
		font-size: clamp(0.61rem, 0.9vw, 0.68rem);
		color: var(--paper-muted);
	}

	.contents-list i {
		font-style: normal;
		color: var(--accent);
	}

	.catalogue-card,
	.contact-grid a,
	.contact-link,
	.press-note,
	.estimate-box,
	.pricing-group {
		border: 1px solid var(--line);
		background: color-mix(in srgb, var(--paper) 76%, var(--paper-deep));
	}

	.catalogue-card {
		min-height: clamp(4.65rem, 8vw, 5.6rem);
		display: grid;
		align-content: space-between;
		padding: clamp(0.52rem, 1.2vw, 0.7rem);
		border-left: 0.34rem solid var(--accent);
	}

	.catalogue-card h3 {
		margin: 0.12rem 0;
		font-size: clamp(1.05rem, 1.55vw, 1.28rem);
		line-height: 1.1;
		font-weight: 500;
	}

	.catalogue-card span,
	.press-note p,
	.manuscript-list,
	.back-cover p {
		margin: 0;
		color: var(--paper-muted);
		font-size: clamp(0.8rem, 1.05vw, 0.94rem);
		line-height: 1.38;
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
	}

	.manuscript-list {
		padding-left: 1.4rem;
		font-size: clamp(1rem, 1.8vw, 1.18rem);
	}

	.contact-grid a,
	.contact-link {
		display: grid;
		gap: 0.3rem;
		padding: clamp(0.85rem, 2vw, 1rem);
		color: var(--paper-ink);
		text-decoration: none;
		overflow-wrap: anywhere;
		text-align: left;
	}

	.image-block {
		margin: 0;
		display: grid;
		gap: 0.45rem;
	}

	.image-block img {
		width: 100%;
		max-height: 26rem;
		object-fit: cover;
	}

	.image-block figcaption {
		color: var(--paper-muted);
		font-size: 0.82rem;
	}

	.pricing-inner {
		height: 100%;
		min-height: 0;
		display: grid;
		grid-template-rows: auto auto minmax(0, 1fr);
		gap: 0.42rem;
		overflow: hidden;
	}

	.pricing-page .page-inner {
		align-content: stretch;
		grid-template-rows: minmax(0, 1fr);
		min-height: 0;
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
		overscroll-behavior: contain;
		padding-right: 0.28rem;
		scrollbar-width: thin;
		touch-action: pan-y;
		-webkit-overflow-scrolling: touch;
	}

	.pricing-group {
		padding: clamp(0.56rem, 1.2vw, 0.76rem);
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
		border-radius: 0;
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
			bottom: clamp(0.4rem, 2vw, 0.8rem);
			background: color-mix(in srgb, var(--paper) 90%, transparent);
		}

		.turn-button--prev {
			left: 0;
		}

		.turn-button--next {
			right: 0;
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

		.about-copy p {
			font-size: 0.82rem;
			line-height: 1.34;
		}

		.press-note {
			display: grid;
		}

		.book-controls {
			grid-template-columns: repeat(3, 1fr);
		}

		.book-controls span {
			grid-column: 1 / -1;
			justify-self: center;
		}
	}
</style>
