import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	deleteContentPage,
	getAdminPage,
	publishContentPage,
	updateContentPageDraft
} from '$lib/server/content';
import { listMediaAssets } from '$lib/server/media';
import {
	normalizeSlug,
	parseBlocks,
	parseBoolean,
	parsePageKind,
	requireString
} from '$lib/server/content/validation';

export const load: PageServerLoad = async ({ params }) => {
	const page = await getAdminPage(Number(params.id));
	if (!page) error(404, 'Page introuvable');

	return {
		page,
		media: await listMediaAssets()
	};
};

export const actions: Actions = {
	save: async ({ request, params }) => {
		const formData = await request.formData();
		const id = Number(params.id);
		const slug = normalizeSlug(requireString(formData, 'slug'));

		try {
			await updateContentPageDraft(id, {
				slug,
				kind: parsePageKind(requireString(formData, 'kind')),
				showInNav: parseBoolean(formData.get('showInNav')),
				title: requireString(formData, 'title'),
				navLabel: requireString(formData, 'navLabel'),
				navNote: requireString(formData, 'navNote'),
				seoTitle: requireString(formData, 'seoTitle'),
				seoDescription: requireString(formData, 'seoDescription'),
				blocks: parseBlocks(requireString(formData, 'blocks'))
			});

			return { message: 'Brouillon enregistré.' };
		} catch (caught) {
			return fail(400, {
				message: caught instanceof Error ? caught.message : 'Enregistrement impossible.'
			});
		}
	},
	publish: async ({ params }) => {
		try {
			await publishContentPage(Number(params.id));
			return { message: 'Page publiée.' };
		} catch (caught) {
			return fail(400, {
				message: caught instanceof Error ? caught.message : 'Publication impossible.'
			});
		}
	},
	delete: async ({ params }) => {
		try {
			await deleteContentPage(Number(params.id));
		} catch (caught) {
			return fail(400, {
				message: caught instanceof Error ? caught.message : 'Suppression impossible.'
			});
		}

		throw redirect(303, '/admin/pages');
	}
};
