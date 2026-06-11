import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	createContentPage,
	deleteContentPage,
	getAdminPages,
	moveContentPage,
	publishContentPage
} from '$lib/server/content';
import { normalizeSlug, parsePageKind, requireString } from '$lib/server/content/validation';

export const load: PageServerLoad = async () => ({
	pages: await getAdminPages()
});

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const title = requireString(formData, 'title');
		const navLabel = requireString(formData, 'navLabel') || title;
		const slug = normalizeSlug(requireString(formData, 'slug') || title);
		const kind = parsePageKind(requireString(formData, 'kind'));

		if (!title || !slug) return fail(400, { message: 'Titre et slug sont requis.' });

		try {
			const page = await createContentPage({
				title,
				navLabel,
				slug,
				kind,
				navNote: requireString(formData, 'navNote'),
				seoTitle: requireString(formData, 'seoTitle') || title,
				seoDescription: requireString(formData, 'seoDescription')
			});
			throw redirect(303, `/admin/pages/${page.id}`);
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : 'Création impossible.'
			});
		}
	},
	move: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		const direction = formData.get('direction') === 'up' ? 'up' : 'down';
		await moveContentPage(id, direction);
		return {};
	},
	publish: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		try {
			await publishContentPage(id);
			return { message: 'Page publiée.' };
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : 'Publication impossible.'
			});
		}
	},
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		try {
			await deleteContentPage(id);
			return { message: 'Page supprimée.' };
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : 'Suppression impossible.'
			});
		}
	}
};
