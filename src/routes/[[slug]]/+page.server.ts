import type { PageServerLoad } from './$types';
import { getPricingConfig, getPublishedBook } from '$lib/server/content';

export const load: PageServerLoad = async ({ params }) => {
	const [book, pricing] = await Promise.all([getPublishedBook(), getPricingConfig('published')]);
	const initialPage = Math.max(
		0,
		book.pages.findIndex((page) => page.slug === (params.slug ?? ''))
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
