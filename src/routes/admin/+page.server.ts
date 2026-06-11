import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAdminPages, resetDefaultContent, seedDefaultContent } from '$lib/server/content';
import { listMediaAssets } from '$lib/server/media';
import { requireString } from '$lib/server/content/validation';

export const load: PageServerLoad = async () => {
	const [pages, media] = await Promise.all([getAdminPages(), listMediaAssets()]);

	return {
		pages,
		mediaCount: media.length,
		publishedCount: pages.filter((page) => page.published).length,
		draftOnlyCount: pages.filter((page) => page.draft && !page.published).length
	};
};

export const actions: Actions = {
	seed: async () => {
		try {
			const created = await seedDefaultContent();
			return { message: created ? 'Contenu initial créé.' : 'Le contenu existe déjà.' };
		} catch (error) {
			return fail(400, { message: error instanceof Error ? error.message : 'Seed impossible.' });
		}
	},
	reset: async ({ request }) => {
		const formData = await request.formData();
		if (requireString(formData, 'confirmation') !== 'RESET') {
			return fail(400, { message: 'Tapez RESET pour confirmer la réinitialisation.' });
		}

		try {
			await resetDefaultContent();
			return { message: 'Pages, paramètres et tarifs réinitialisés.' };
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : 'Réinitialisation impossible.'
			});
		}
	}
};
