<script lang="ts">
	import { browser } from '$app/environment';
	import { beforeNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
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

	let { data }: PageProps = $props();

	const euroFormatter = new Intl.NumberFormat('fr-FR', {
		style: 'currency',
		currency: 'EUR',
		maximumFractionDigits: 0
	});
	const pricingStorageKey = 'afleurdelignes-pricing-configurator';
	const editorialHighlights = ['Mise en page', 'Couverture', 'EPUB', 'Publication', 'Suivi auteur'];

	let navIsOpen = $state(false);
	let turnDirection = $state<'forward' | 'back'>('forward');
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
	let activePage = $derived(pages[data.initialPage] ?? pages[0]);
	let activeSlug = $derived(activePage?.slug ?? '');
	let navPages = $derived(
		pages.filter((page) => page.showInNav && page.kind !== 'back_cover' && page.slug !== 'sommaire')
	);
	let submissionPage = $derived(
		pages.find((page) => page.slug === 'soumission') ??
			pages.find((page) => page.slug === 'manuscrits') ??
			navPages.find((page) => page.navLabel.toLowerCase().includes('soumission')) ??
			navPages[0]
	);
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

	if (browser) {
		beforeNavigate((navigation) => {
			if (navigation.to?.route.id !== '/[[slug]]') return;
			const fromOrder = pageOrderFromPath(navigation.from?.url.pathname ?? '/');
			const toOrder = pageOrderFromPath(navigation.to.url.pathname);
			turnDirection = toOrder < fromOrder ? 'back' : 'forward';
		});
	}

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

	function formatEuro(amount: number) {
		return euroFormatter.format(amount);
	}

	function blockImageSource(block: Extract<PageBlock, { type: 'image' }>) {
		if (block.mediaId) return `/media/${block.mediaId}`;
		return block.src ?? '';
	}

	function openExternalHref(href: string) {
		if (browser) window.location.href = href;
	}

	function pageTone(page: PublishedPage) {
		if (page.slug === '' || page.kind === 'cover') return 'home';
		if (
			page.kind === 'pricing' ||
			page.blocks.some((block) => block.type === 'pricingConfigurator')
		) {
			return 'pricing';
		}
		if (page.kind === 'catalogue' || page.blocks.some((block) => block.type === 'catalogueCards')) {
			return 'books';
		}
		return 'content';
	}

	function pageOrderFromPath(pathname: string) {
		const slug = slugFromPath(pathname);
		const index = pages.findIndex((page) => page.slug === slug);
		return index >= 0 ? index : 0;
	}

	function shouldShowEyebrow(label: string | undefined) {
		if (!label) return false;
		const normalizedLabel = normalizeLabel(label);
		return (
			normalizedLabel !== normalizeLabel(activePage.title) &&
			normalizedLabel !== normalizeLabel(activePage.navLabel)
		);
	}

	function normalizeLabel(label: string) {
		return label.trim().toLocaleLowerCase('fr-FR');
	}

	function slugFromPath(pathname: string) {
		const cleanPath = pathname.replace(/\/+$/, '');
		const segment = cleanPath.split('/').filter(Boolean).at(-1) ?? '';

		try {
			return decodeURIComponent(segment);
		} catch {
			return segment;
		}
	}
</script>

<svelte:head>
	<title>{data.seoTitle}</title>
	<meta name="description" content={data.seoDescription} />
	<meta property="og:title" content={data.seoTitle} />
	<meta property="og:description" content={data.seoDescription} />
	<meta property="og:image" content={data.ogImage} />
</svelte:head>

<main class="site-shell" data-page={pageTone(activePage)}>
	<header class="site-header">
		<a
			class="brand"
			href={resolve('/')}
			aria-label={`${data.book.settings.siteName} - accueil`}
			onclick={() => (navIsOpen = false)}
		>
			<picture>
				<source srcset={data.book.settings.coverLogoDark} media="(prefers-color-scheme: dark)" />
				<img src={data.book.settings.coverLogoLight} alt="" />
			</picture>
			<span>{data.book.settings.siteName}</span>
		</a>

		<nav id="site-navigation" class:open={navIsOpen} aria-label="Navigation principale">
			<a
				href={resolve('/')}
				aria-current={activeSlug === '' ? 'page' : undefined}
				onclick={() => (navIsOpen = false)}
			>
				<span>Accueil</span>
			</a>
			{#each navPages as item (item.id)}
				<a
					href={resolve(`/${item.slug}`)}
					aria-current={activeSlug === item.slug ? 'page' : undefined}
					onclick={() => (navIsOpen = false)}
				>
					<span>{item.navLabel}</span>
					{#if item.navNote}<small>{item.navNote}</small>{/if}
				</a>
			{/each}
		</nav>

		{#if submissionPage}
			<a
				class="header-cta"
				href={resolve(`/${submissionPage.slug}`)}
				aria-label="Déposer un projet"
				onclick={() => (navIsOpen = false)}
			>
				<span class="cta-full">Déposer un projet</span>
				<span class="cta-short">Déposer</span>
			</a>
		{/if}

		<button
			class="nav-toggle"
			type="button"
			aria-controls="site-navigation"
			aria-expanded={navIsOpen}
			aria-label="Ouvrir le menu"
			title="Menu"
			onclick={() => (navIsOpen = !navIsOpen)}
		>
			<span></span>
			<span></span>
			<span></span>
		</button>
	</header>

	{#key activePage.id}
		<article
			class={`page-view page-view--${pageTone(activePage)}`}
			data-turn={turnDirection}
			aria-labelledby="page-title"
		>
			{#if activePage.slug === '' || activePage.kind === 'cover'}
				<section class="home-hero">
					<picture class="hero-image">
						<source
							srcset={resolve('/assets/brand/editorial-hero-dark.png')}
							media="(prefers-color-scheme: dark)"
						/>
						<img
							src={resolve('/assets/brand/editorial-hero.png')}
							alt="Table de travail éditorial avec manuscrit, livres et papiers de couverture"
						/>
					</picture>
					<div class="hero-overlay"></div>
					<div class="hero-content">
						{#each activePage.blocks as block (block.id)}
							{@render renderBlock(block)}
						{/each}
					</div>
				</section>

				<section class="editorial-strip" aria-label="Prestations éditoriales">
					{#each editorialHighlights as item (item)}
						<span>{item}</span>
					{/each}
				</section>
			{:else}
				<section class="page-heading">
					{#if shouldShowEyebrow(activePage.navLabel)}
						<p class="eyebrow">{activePage.navLabel}</p>
					{/if}
					<h1 id="page-title">{activePage.title}</h1>
					{#if activePage.navNote}<p>{activePage.navNote}</p>{/if}
				</section>

				<div class="content-stack">
					{#each activePage.blocks as block (block.id)}
						{@render renderBlock(block)}
					{/each}
				</div>
			{/if}
		</article>
	{/key}

	<footer class="site-footer">
		<p>{data.book.settings.siteName}</p>
		<nav aria-label="Navigation secondaire">
			{#each navPages as item (item.id)}
				<a href={resolve(`/${item.slug}`)}>{item.navLabel}</a>
			{/each}
		</nav>
	</footer>
</main>

{#snippet renderBlock(block: PageBlock)}
	{#if block.type === 'hero'}
		<section class="hero-block">
			{#if shouldShowEyebrow(block.eyebrow)}<p class="eyebrow">{block.eyebrow}</p>{/if}
			{#if activePage.slug === '' || activePage.kind === 'cover'}
				<h1 id="page-title">{block.title}</h1>
			{:else}
				<h2>{block.title}</h2>
			{/if}
			{#if block.body}<p class="lead">{block.body}</p>{/if}
			{#if block.buttonLabel}
				<a class="button-link" href={resolve(block.targetSlug ? `/${block.targetSlug}` : '/')}>
					{block.buttonLabel}
				</a>
			{/if}
		</section>
	{:else if block.type === 'paragraphs'}
		<section class="copy-block">
			{#if shouldShowEyebrow(block.eyebrow)}<p class="eyebrow">{block.eyebrow}</p>{/if}
			{#if block.title}<h2>{block.title}</h2>{/if}
			<div class="copy-flow">
				{#each block.paragraphs as paragraph (paragraph)}
					<p>{paragraph}</p>
				{/each}
			</div>
		</section>
	{:else if block.type === 'list'}
		<section class="copy-block list-block">
			{#if shouldShowEyebrow(block.eyebrow)}<p class="eyebrow">{block.eyebrow}</p>{/if}
			<h2>{block.title}</h2>
			{#if block.intro}<p class="lead">{block.intro}</p>{/if}
			<ol class="manuscript-list">
				{#each block.items as item (item)}
					<li>{item}</li>
				{/each}
			</ol>
		</section>
	{:else if block.type === 'catalogueCards'}
		<section class="copy-block catalogue-block">
			{#if shouldShowEyebrow(block.eyebrow)}<p class="eyebrow">{block.eyebrow}</p>{/if}
			<h2>{block.title}</h2>
			<div class="book-grid">
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
						<a
							class="button-link button-link--quiet"
							href={resolve(block.targetSlug ? `/${block.targetSlug}` : '/')}
						>
							{block.ctaLabel}
						</a>
					{/if}
				</div>
			{/if}
		</section>
	{:else if block.type === 'contactLinks'}
		<section class="copy-block contact-block">
			{#if shouldShowEyebrow(block.eyebrow)}<p class="eyebrow">{block.eyebrow}</p>{/if}
			<h2>{block.title}</h2>
			<div class="contact-grid">
				{#each block.links as link (link.href)}
					{#if link.href.startsWith('/')}
						<a href={resolve(link.href)}>
							<span>{link.label}</span>
							{link.text}
						</a>
					{:else}
						<button type="button" onclick={() => openExternalHref(link.href)}>
							<span>{link.label}</span>
							{link.text}
						</button>
					{/if}
				{/each}
			</div>
			{#if block.ctaLabel}
				<a
					class="button-link button-link--quiet"
					href={resolve(block.targetSlug ? `/${block.targetSlug}` : '/')}
				>
					{block.ctaLabel}
				</a>
			{/if}
		</section>
	{:else if block.type === 'pricingConfigurator'}
		<section class="pricing-inner">
			<div class="pricing-header">
				<div>
					{#if shouldShowEyebrow(block.eyebrow ?? 'Tarifs')}
						<p class="eyebrow">{block.eyebrow ?? 'Tarifs'}</p>
					{/if}
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

			<form class="pricing-form" onsubmit={(event) => event.preventDefault()}>
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
		<a
			class="button-link button-link--quiet"
			href={resolve(block.targetSlug ? `/${block.targetSlug}` : '/')}
		>
			{block.label}
		</a>
	{/if}
{/snippet}

<style>
	:global(:root) {
		color-scheme: light;
		--bg: #f4f0e8;
		--surface: #fffdf8;
		--surface-warm: #efe5d6;
		--ink: #24211d;
		--muted: #6f685d;
		--line: rgba(42, 36, 29, 0.16);
		--sage: #63735f;
		--sage-dark: #394b3f;
		--clay: #a85f43;
		--blue: #35536b;
		--paper-shadow: rgba(45, 35, 22, 0.14);
		--header-height: 5.35rem;
		font-family:
			Inter,
			ui-sans-serif,
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		color: var(--ink);
		background: var(--bg);
	}

	:global(*) {
		box-sizing: border-box;
		letter-spacing: 0;
	}

	:global(body) {
		background: var(--bg);
	}

	:global(a) {
		color: inherit;
	}

	@media (prefers-color-scheme: dark) {
		:global(:root) {
			color-scheme: dark;
			--bg: #191917;
			--surface: #24231f;
			--surface-warm: #302b24;
			--ink: #f5efe4;
			--muted: #b8afa1;
			--line: rgba(245, 239, 228, 0.16);
			--sage: #9baa8c;
			--sage-dark: #c5d1b7;
			--clay: #d28a68;
			--blue: #9dbad0;
			--paper-shadow: rgba(0, 0, 0, 0.34);
		}
	}

	.site-shell {
		min-height: 100svh;
		background:
			linear-gradient(90deg, color-mix(in srgb, var(--line) 36%, transparent) 1px, transparent 1px)
				0 0 / 4rem 4rem,
			var(--bg);
	}

	.site-header {
		position: sticky;
		top: 0;
		z-index: 20;
		min-height: var(--header-height);
		display: grid;
		grid-template-columns: minmax(10rem, 1fr) auto auto;
		align-items: center;
		gap: clamp(0.75rem, 2vw, 1.4rem);
		padding: 0.8rem clamp(1rem, 4vw, 3rem);
		border-bottom: 1px solid var(--line);
		background: color-mix(in srgb, var(--surface) 90%, transparent);
		backdrop-filter: blur(18px);
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.8rem;
		width: fit-content;
		text-decoration: none;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: clamp(1rem, 1.55vw, 1.24rem);
		line-height: 1;
		color: var(--ink);
	}

	.brand picture,
	.brand img {
		width: 3.05rem;
		aspect-ratio: 1;
		display: block;
	}

	.brand img {
		height: auto;
		object-fit: contain;
	}

	#site-navigation {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
	}

	#site-navigation a {
		display: grid;
		gap: 0.08rem;
		min-height: 2.8rem;
		align-content: center;
		padding: 0.44rem 0.68rem;
		border-radius: 999px;
		color: var(--muted);
		text-decoration: none;
		font-size: clamp(0.82rem, 1vw, 0.94rem);
		line-height: 1.05;
		transition:
			background 160ms ease,
			color 160ms ease,
			transform 160ms ease;
	}

	#site-navigation a:hover,
	#site-navigation a[aria-current='page'] {
		background: color-mix(in srgb, var(--sage) 14%, transparent);
		color: var(--sage-dark);
	}

	#site-navigation a:hover {
		transform: translateY(-1px);
	}

	#site-navigation small {
		display: none;
		font-size: 0.68rem;
		color: var(--muted);
	}

	.header-cta,
	.button-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: fit-content;
		min-height: 2.78rem;
		padding: 0.72rem 1.05rem;
		border: 1px solid color-mix(in srgb, var(--sage-dark) 44%, transparent);
		border-radius: 999px;
		background: var(--sage-dark);
		color: var(--surface);
		text-decoration: none;
		font-weight: 700;
		font-size: 0.9rem;
		line-height: 1;
		transition:
			transform 160ms ease,
			background 160ms ease,
			border-color 160ms ease;
	}

	.header-cta:hover,
	.button-link:hover {
		transform: translateY(-1px);
		background: var(--clay);
		border-color: var(--clay);
	}

	.cta-short {
		display: none;
	}

	.button-link--quiet {
		background: transparent;
		color: var(--sage-dark);
		border-color: color-mix(in srgb, var(--sage) 42%, transparent);
	}

	.button-link--quiet:hover {
		color: var(--surface);
	}

	.nav-toggle {
		display: none;
		width: 2.25rem;
		aspect-ratio: 1;
		place-items: center;
		align-content: center;
		gap: 0.27rem;
		border: 0;
		border-radius: 0;
		background: transparent;
		color: var(--ink);
		cursor: pointer;
		padding: 0;
	}

	.nav-toggle span {
		width: 1.35rem;
		height: 2px;
		display: block;
		background: currentColor;
	}

	.page-view {
		position: relative;
		min-height: calc(100svh - var(--header-height));
		overflow-x: clip;
		transform-origin: right center;
		animation: page-enter-forward 620ms cubic-bezier(0.2, 0.72, 0.18, 1) both;
	}

	.page-view[data-turn='back'] {
		transform-origin: left center;
		animation-name: page-enter-back;
	}

	.page-view::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 8;
		pointer-events: none;
		background: linear-gradient(
			90deg,
			transparent,
			color-mix(in srgb, var(--surface) 72%, transparent) 42%,
			color-mix(in srgb, var(--ink) 10%, transparent) 52%,
			transparent
		);
		transform: translateX(-110%) skewX(-10deg);
		animation: page-sheen-forward 620ms cubic-bezier(0.2, 0.72, 0.18, 1) both;
	}

	.page-view[data-turn='back']::after {
		animation-name: page-sheen-back;
	}

	.home-hero {
		position: relative;
		min-height: min(46rem, calc(100svh - var(--header-height) - 5rem));
		display: grid;
		align-items: center;
		overflow: hidden;
		background: #ebe2d5;
	}

	.hero-image,
	.hero-overlay {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.hero-image {
		object-fit: cover;
		object-position: center;
	}

	.hero-image img {
		width: 100%;
		height: 100%;
		display: block;
		object-fit: cover;
		object-position: center;
	}

	.hero-overlay {
		background:
			linear-gradient(
				90deg,
				rgba(244, 240, 232, 0.96) 0%,
				rgba(244, 240, 232, 0.82) 34%,
				rgba(244, 240, 232, 0.24) 68%,
				rgba(244, 240, 232, 0.06) 100%
			),
			linear-gradient(180deg, rgba(244, 240, 232, 0.08), rgba(244, 240, 232, 0.34));
	}

	.hero-content {
		position: relative;
		z-index: 1;
		width: min(100%, 76rem);
		padding: clamp(3.4rem, 8vw, 7rem) clamp(1rem, 5vw, 4rem);
	}

	.hero-block,
	.copy-block,
	.pricing-inner,
	.image-block {
		display: grid;
		gap: clamp(0.85rem, 1.6vw, 1.2rem);
	}

	.hero-block {
		max-width: 44rem;
	}

	.eyebrow {
		margin: 0;
		color: var(--clay);
		font-size: 0.76rem;
		font-weight: 800;
		letter-spacing: 0;
		text-transform: uppercase;
	}

	h1,
	h2,
	h3,
	p {
		margin-top: 0;
	}

	h1,
	h2,
	h3 {
		color: var(--ink);
		text-wrap: balance;
	}

	h1 {
		margin-bottom: 0;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: clamp(3rem, 8vw, 7rem);
		font-weight: 500;
		line-height: 0.94;
	}

	h2 {
		margin-bottom: 0;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: clamp(1.9rem, 3.4vw, 3.2rem);
		font-weight: 500;
		line-height: 1;
	}

	h3 {
		margin-bottom: 0;
		font-size: clamp(1.05rem, 1.6vw, 1.28rem);
		line-height: 1.12;
	}

	.lead {
		margin-bottom: 0;
		max-width: 42rem;
		color: var(--muted);
		font-size: clamp(1.04rem, 1.55vw, 1.28rem);
		line-height: 1.55;
	}

	.editorial-strip {
		width: min(100%, 76rem);
		display: flex;
		flex-wrap: wrap;
		gap: 0.55rem;
		margin: 0 auto;
		padding: 1rem clamp(1rem, 4vw, 3rem) 1.25rem;
	}

	.editorial-strip span {
		display: inline-flex;
		align-items: center;
		min-height: 2.1rem;
		padding: 0.45rem 0.72rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: color-mix(in srgb, var(--surface) 78%, transparent);
		color: var(--muted);
		font-size: 0.86rem;
	}

	.page-heading,
	.content-stack,
	.site-footer {
		width: min(100%, 76rem);
		margin: 0 auto;
		padding-inline: clamp(1rem, 4vw, 3rem);
	}

	.page-heading {
		display: grid;
		gap: 0.8rem;
		padding-top: clamp(3rem, 7vw, 6rem);
		padding-bottom: clamp(1.5rem, 3vw, 2.5rem);
	}

	.page-heading h1 {
		max-width: 56rem;
		font-size: clamp(2.6rem, 6vw, 5.4rem);
	}

	.page-heading p:not(.eyebrow) {
		max-width: 38rem;
		margin-bottom: 0;
		color: var(--muted);
		font-size: clamp(1rem, 1.6vw, 1.18rem);
		line-height: 1.45;
	}

	.content-stack {
		display: grid;
		gap: clamp(1.4rem, 3vw, 2.5rem);
		padding-bottom: clamp(4rem, 7vw, 6rem);
	}

	.copy-block {
		max-width: 64rem;
	}

	.copy-flow {
		display: grid;
		gap: 0.8rem;
		max-width: 54rem;
	}

	.copy-flow p {
		margin-bottom: 0;
		color: var(--muted);
		font-size: clamp(1rem, 1.4vw, 1.14rem);
		line-height: 1.72;
	}

	.list-block .lead {
		font-size: clamp(1rem, 1.35vw, 1.14rem);
	}

	.manuscript-list {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.7rem;
		margin: 0;
		padding: 0;
		list-style: none;
		counter-reset: manuscript;
	}

	.manuscript-list li {
		counter-increment: manuscript;
		position: relative;
		min-height: 4rem;
		padding: 1rem 1rem 1rem 3.2rem;
		border: 1px solid var(--line);
		background: color-mix(in srgb, var(--surface) 86%, transparent);
		color: var(--ink);
		line-height: 1.35;
	}

	.manuscript-list li::before {
		content: counter(manuscript, decimal-leading-zero);
		position: absolute;
		left: 1rem;
		top: 1rem;
		color: var(--clay);
		font-size: 0.76rem;
		font-weight: 800;
	}

	.book-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: clamp(0.85rem, 1.8vw, 1.25rem);
	}

	.catalogue-card,
	.contact-grid a,
	.contact-grid button,
	.press-note,
	.estimate-box,
	.pricing-group {
		border: 1px solid var(--line);
		background: color-mix(in srgb, var(--surface) 92%, transparent);
		box-shadow: 0 1rem 2.2rem var(--paper-shadow);
	}

	.catalogue-card {
		min-height: 17rem;
		display: grid;
		align-content: end;
		gap: 0.55rem;
		padding: 1.15rem;
		border-top: 0.34rem solid var(--sage);
	}

	.catalogue-card:nth-child(2n) {
		border-top-color: var(--clay);
	}

	.catalogue-card:nth-child(3n) {
		border-top-color: var(--blue);
	}

	.catalogue-card p,
	.catalogue-card span,
	.catalogue-card strong,
	.contact-grid span,
	.estimate-box span,
	.estimate-box small,
	.pricing-group h3,
	.pricing-group label > span {
		margin: 0;
	}

	.catalogue-card p,
	.contact-grid span,
	.estimate-box span,
	.estimate-box small,
	.pricing-group h3,
	.pricing-group label > span {
		color: var(--muted);
		font-size: 0.74rem;
		font-weight: 800;
		text-transform: uppercase;
	}

	.catalogue-card h3 {
		font-family: Georgia, 'Times New Roman', serif;
		font-size: clamp(1.35rem, 2vw, 1.8rem);
		font-weight: 500;
	}

	.catalogue-card span {
		color: var(--muted);
	}

	.catalogue-card strong {
		color: var(--clay);
		font-weight: 800;
	}

	.press-note {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem;
		box-shadow: none;
	}

	.press-note p {
		margin-bottom: 0;
		color: var(--muted);
		line-height: 1.45;
	}

	.contact-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: clamp(0.85rem, 1.8vw, 1.25rem);
	}

	.contact-grid a {
		display: grid;
		gap: 0.45rem;
		min-height: 8.5rem;
		align-content: end;
		padding: 1rem;
		color: var(--ink);
		text-decoration: none;
		overflow-wrap: anywhere;
		transition:
			transform 160ms ease,
			border-color 160ms ease;
	}

	.contact-grid button {
		display: grid;
		gap: 0.45rem;
		min-height: 8.5rem;
		align-content: end;
		padding: 1rem;
		border: 1px solid var(--line);
		color: var(--ink);
		font: inherit;
		text-decoration: none;
		overflow-wrap: anywhere;
		text-align: left;
		cursor: pointer;
		transition:
			transform 160ms ease,
			border-color 160ms ease;
	}

	.contact-grid a:hover,
	.contact-grid button:hover {
		transform: translateY(-2px);
		border-color: color-mix(in srgb, var(--sage) 52%, transparent);
	}

	.image-block {
		margin: 0;
	}

	.image-block img {
		width: 100%;
		max-height: 32rem;
		object-fit: cover;
	}

	.image-block figcaption {
		color: var(--muted);
		font-size: 0.9rem;
	}

	.pricing-inner {
		max-width: none;
	}

	.pricing-header {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(16rem, 24rem);
		gap: clamp(1rem, 2vw, 1.5rem);
		align-items: stretch;
	}

	.estimate-box {
		display: grid;
		gap: 0.35rem;
		align-content: center;
		padding: clamp(1rem, 2vw, 1.35rem);
		border-left: 0.38rem solid var(--clay);
	}

	.estimate-box strong {
		color: var(--clay);
		font-family: Georgia, 'Times New Roman', serif;
		font-size: clamp(2rem, 4vw, 3.1rem);
		font-weight: 500;
		line-height: 0.95;
	}

	.estimate-box small {
		line-height: 1.25;
		text-transform: none;
	}

	.pricing-form {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: clamp(0.9rem, 1.8vw, 1.25rem);
	}

	.pricing-group {
		display: grid;
		gap: 0.75rem;
		padding: clamp(0.95rem, 1.8vw, 1.2rem);
		box-shadow: none;
	}

	.option-grid,
	.toggle-grid,
	.volume-grid,
	.compact-fields {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.58rem;
	}

	.option-grid label,
	.toggle-grid label,
	.volume-grid label,
	.compact-fields label {
		display: flex;
		align-items: center;
		gap: 0.48rem;
		min-height: 2.45rem;
		color: var(--ink);
		font-size: 0.92rem;
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
		min-height: 2.5rem;
		border: 1px solid var(--line);
		border-radius: 0.35rem;
		background: var(--surface);
		color: var(--ink);
		font: inherit;
	}

	.pricing-group input[type='radio'],
	.pricing-group input[type='checkbox'] {
		position: relative;
		width: 1.08rem;
		height: 1.08rem;
		min-height: 1.08rem;
		flex: 0 0 auto;
		appearance: none;
		border: 1.5px solid color-mix(in srgb, var(--ink) 48%, transparent);
		border-radius: 0.25rem;
		background: var(--surface);
		box-shadow: inset 0 0 0 2px var(--surface);
		cursor: pointer;
	}

	.pricing-group input[type='radio'] {
		border-radius: 50%;
	}

	.pricing-group input[type='checkbox']:checked,
	.pricing-group input[type='radio']:checked {
		border-color: var(--sage-dark);
		background: var(--sage-dark);
	}

	.pricing-group input[type='checkbox']:checked::after {
		content: '';
		position: absolute;
		left: 0.31rem;
		top: 0.12rem;
		width: 0.35rem;
		height: 0.62rem;
		border: solid var(--surface);
		border-width: 0 0.13rem 0.13rem 0;
		transform: rotate(45deg);
	}

	.pricing-group input[type='radio']:checked::after {
		content: '';
		position: absolute;
		inset: 0.29rem;
		border-radius: 50%;
		background: var(--surface);
	}

	.pricing-group input:focus-visible,
	.pricing-group select:focus-visible,
	.button-link:focus-visible,
	.header-cta:focus-visible,
	#site-navigation a:focus-visible,
	.brand:focus-visible,
	.nav-toggle:focus-visible {
		outline: 2px solid var(--clay);
		outline-offset: 3px;
	}

	.breakdown {
		grid-column: 1 / -1;
	}

	.breakdown dl {
		display: grid;
		gap: 0.45rem;
		margin: 0;
	}

	.breakdown div {
		display: flex;
		justify-content: space-between;
		gap: 0.8rem;
		border-bottom: 1px solid color-mix(in srgb, var(--line) 74%, transparent);
		padding-bottom: 0.4rem;
	}

	.breakdown dt,
	.breakdown dd {
		margin: 0;
	}

	.breakdown dd {
		color: var(--clay);
		font-weight: 800;
	}

	.site-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding-block: 1.4rem;
		border-top: 1px solid var(--line);
		color: var(--muted);
	}

	.site-footer p {
		margin-bottom: 0;
		font-family: Georgia, 'Times New Roman', serif;
		color: var(--ink);
	}

	.site-footer nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.8rem;
		justify-content: flex-end;
	}

	.site-footer a {
		color: var(--muted);
		text-decoration: none;
	}

	.site-footer a:hover {
		color: var(--sage-dark);
	}

	@keyframes page-enter-forward {
		0% {
			opacity: 0.58;
			transform: perspective(1800px) rotateY(16deg) translateX(4%);
			filter: brightness(1.08);
		}
		100% {
			opacity: 1;
			transform: perspective(1800px) rotateY(0) translateX(0);
			filter: brightness(1);
		}
	}

	@keyframes page-enter-back {
		0% {
			opacity: 0.58;
			transform: perspective(1800px) rotateY(-16deg) translateX(-4%);
			filter: brightness(1.08);
		}
		100% {
			opacity: 1;
			transform: perspective(1800px) rotateY(0) translateX(0);
			filter: brightness(1);
		}
	}

	@keyframes page-sheen-forward {
		0% {
			opacity: 0;
			transform: translateX(-110%) skewX(-10deg);
		}
		22% {
			opacity: 0.64;
		}
		100% {
			opacity: 0;
			transform: translateX(110%) skewX(-10deg);
		}
	}

	@keyframes page-sheen-back {
		0% {
			opacity: 0;
			transform: translateX(110%) skewX(10deg);
		}
		22% {
			opacity: 0.64;
		}
		100% {
			opacity: 0;
			transform: translateX(-110%) skewX(10deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.page-view,
		.page-view::after {
			animation: none;
		}

		* {
			scroll-behavior: auto;
		}
	}

	@media (max-width: 980px) {
		.site-header {
			grid-template-columns: minmax(0, 1fr) auto auto;
		}

		.nav-toggle {
			display: grid;
		}

		#site-navigation {
			position: absolute;
			top: calc(100% + 1px);
			left: 0;
			right: 0;
			display: none;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0;
			padding: 0.65rem clamp(1rem, 4vw, 3rem) 1rem;
			border-bottom: 1px solid var(--line);
			background: var(--surface);
			box-shadow: 0 1rem 2rem var(--paper-shadow);
		}

		#site-navigation.open {
			display: grid;
		}

		#site-navigation a {
			border-radius: 0.45rem;
		}

		#site-navigation small {
			display: block;
		}

		.home-hero {
			min-height: 34rem;
		}

		.hero-overlay {
			background:
				linear-gradient(90deg, rgba(244, 240, 232, 0.96), rgba(244, 240, 232, 0.46)),
				linear-gradient(180deg, rgba(244, 240, 232, 0.1), rgba(244, 240, 232, 0.6));
		}

		.book-grid,
		.contact-grid,
		.pricing-header,
		.pricing-form {
			grid-template-columns: 1fr;
		}

		.catalogue-card {
			min-height: 11rem;
		}
	}

	@media (max-width: 640px) {
		:global(:root) {
			--header-height: 4.9rem;
		}

		.site-header {
			gap: 0.6rem;
			padding-inline: 0.85rem;
		}

		.brand {
			gap: 0.5rem;
			font-size: 0.92rem;
		}

		.brand picture,
		.brand img {
			width: 2.35rem;
		}

		.header-cta {
			min-height: 2.35rem;
			padding: 0.58rem 0.72rem;
			font-size: 0.82rem;
		}

		.nav-toggle {
			width: 2.05rem;
		}

		.cta-full {
			display: none;
		}

		.cta-short {
			display: inline;
		}

		#site-navigation {
			grid-template-columns: 1fr;
		}

		.home-hero {
			min-height: calc(100svh - var(--header-height) - 4.5rem);
		}

		.hero-image {
			object-position: 62% center;
		}

		.hero-image img {
			object-position: 62% center;
		}

		.hero-overlay {
			background:
				linear-gradient(180deg, rgba(244, 240, 232, 0.96), rgba(244, 240, 232, 0.58)),
				linear-gradient(90deg, rgba(244, 240, 232, 0.94), rgba(244, 240, 232, 0.18));
		}

		h1 {
			font-size: clamp(2.8rem, 18vw, 4.5rem);
		}

		.page-heading h1 {
			font-size: clamp(2.45rem, 14vw, 4rem);
		}

		.editorial-strip {
			padding-top: 0.8rem;
		}

		.manuscript-list,
		.option-grid,
		.toggle-grid,
		.volume-grid,
		.compact-fields {
			grid-template-columns: 1fr;
		}

		.press-note,
		.site-footer {
			display: grid;
		}

		.site-footer nav {
			justify-content: start;
		}
	}

	@media (prefers-color-scheme: dark) {
		.hero-overlay {
			background:
				linear-gradient(
					90deg,
					rgba(25, 25, 23, 0.96) 0%,
					rgba(25, 25, 23, 0.82) 34%,
					rgba(25, 25, 23, 0.34) 68%,
					rgba(25, 25, 23, 0.08) 100%
				),
				linear-gradient(180deg, rgba(25, 25, 23, 0.1), rgba(25, 25, 23, 0.42));
		}
	}

	@media (prefers-color-scheme: dark) and (max-width: 980px) {
		.hero-overlay {
			background:
				linear-gradient(90deg, rgba(25, 25, 23, 0.94), rgba(25, 25, 23, 0.48)),
				linear-gradient(180deg, rgba(25, 25, 23, 0.08), rgba(25, 25, 23, 0.68));
		}
	}

	@media (prefers-color-scheme: dark) and (max-width: 640px) {
		.hero-overlay {
			background:
				linear-gradient(180deg, rgba(25, 25, 23, 0.96), rgba(25, 25, 23, 0.62)),
				linear-gradient(90deg, rgba(25, 25, 23, 0.94), rgba(25, 25, 23, 0.2));
		}
	}
</style>
