import type { PageServerLoad } from './$types';
import { defaultPages } from '$lib/content/defaults';
import type { PublishedBook } from '$lib/content/types';
import { getPricingConfig, getPublishedBook } from '$lib/server/content';

export const load: PageServerLoad = async ({ params }) => {
	const [rawBook, pricing] = await Promise.all([getPublishedBook(), getPricingConfig('published')]);
	const book = normalizeLegacyPublicStructure(rawBook);
	const requestedSlug = resolveRequestedSlug(params.slug ?? '', book);
	const initialPage = Math.max(
		0,
		book.pages.findIndex((page) => page.slug === requestedSlug)
	);
	const currentPage = book.pages[initialPage] ?? book.pages[0];

	return {
		book,
		pricing,
		initialPage,
		seoTitle: currentPage?.seoTitle ?? book.settings.siteName,
		seoDescription: currentPage?.seoDescription ?? book.settings.siteDescription,
		ogImage: book.settings.ogImage
	};
};

const legacySlugAliases: Record<string, string> = {
	catalogue: 'livres',
	manuscrits: 'soumission',
	sommaire: '',
	auteurs: 'soumission',
	dos: ''
};

function normalizeLegacyPublicStructure(book: PublishedBook): PublishedBook {
	const slugs = new Set(book.pages.map((page) => page.slug));
	const hasLegacyBookSite =
		slugs.has('sommaire') || slugs.has('catalogue') || slugs.has('manuscrits');

	if (!hasLegacyBookSite) return book;

	return {
		...book,
		pages: defaultPages
	};
}

function resolveRequestedSlug(slug: string, book: PublishedBook) {
	if (book.pages.some((page) => page.slug === slug)) return slug;
	return legacySlugAliases[slug] ?? slug;
}
