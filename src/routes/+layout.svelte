<script lang="ts">
	import { page } from '$app/state';
	import './layout.css';

	let { children } = $props();

	const siteName = 'À fleur de lignes';
	const siteDescription =
		'Création, mise en page et publication de livres papier et numériques pour auteurs et maisons d’édition.';
	const titleByPath: Record<string, string> = {
		'/': siteName,
		'/sommaire': `Sommaire | ${siteName}`,
		'/a-propos': `À propos | ${siteName}`,
		'/a-propos-suite': `À propos | ${siteName}`,
		'/catalogue': `Catalogue | ${siteName}`,
		'/auteurs': `Auteurs | ${siteName}`,
		'/manuscrits': `Manuscrits | ${siteName}`,
		'/tarifs': `Tarifs | ${siteName}`,
		'/contact': `Contact | ${siteName}`,
		'/dos': siteName
	};

	let pageTitle = $derived(titleByPath[page.url.pathname] ?? siteName);
	let canonicalUrl = $derived(page.url.origin + page.url.pathname);
	let ogImageUrl = $derived(`${page.url.origin}/og-image.png`);
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={siteDescription} />
	<meta name="application-name" content={siteName} />
	<meta name="apple-mobile-web-app-title" content={siteName} />
	<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#050505" media="(prefers-color-scheme: dark)" />
	<link rel="canonical" href={canonicalUrl} />
	<link rel="icon" href="/favicon.ico?v=2" sizes="any" />
	<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
	<link
		rel="icon"
		type="image/png"
		sizes="16x16"
		href="/favicon-16x16.png?v=2"
		media="(prefers-color-scheme: light)"
	/>
	<link
		rel="icon"
		type="image/png"
		sizes="16x16"
		href="/favicon-dark-16x16.png?v=2"
		media="(prefers-color-scheme: dark)"
	/>
	<link
		rel="icon"
		type="image/png"
		sizes="32x32"
		href="/favicon-32x32.png?v=2"
		media="(prefers-color-scheme: light)"
	/>
	<link
		rel="icon"
		type="image/png"
		sizes="32x32"
		href="/favicon-dark-32x32.png?v=2"
		media="(prefers-color-scheme: dark)"
	/>
	<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
	<link rel="manifest" href="/site.webmanifest" />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={siteDescription} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Logo À fleur de lignes" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={siteDescription} />
	<meta name="twitter:image" content={ogImageUrl} />
</svelte:head>
{@render children()}
