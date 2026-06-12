import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { defaultPages } from '$lib/content/defaults';
import type { PublishedBook } from '$lib/content/types';
import { getPricingConfig, getPublishedBook } from '$lib/server/content';
import { createProjectSubmission } from '$lib/server/project-submissions';

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

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		try {
			await createProjectSubmission(formData);
			return {
				success: true,
				message: 'Votre projet a bien été transmis.'
			};
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : 'Envoi impossible.',
				values: {
					fullName: stringValue(formData, 'fullName'),
					email: stringValue(formData, 'email'),
					message: stringValue(formData, 'message')
				}
			});
		}
	}
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

function stringValue(formData: FormData, key: string) {
	const value = formData.get(key);
	return typeof value === 'string' ? value : '';
}
