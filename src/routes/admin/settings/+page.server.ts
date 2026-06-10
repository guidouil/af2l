import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getSiteSettings, publishSiteSettings, saveSiteSettingsDraft } from '$lib/server/content';
import { parseSiteSettings, requireString } from '$lib/server/content/validation';

export const load: PageServerLoad = async () => ({
	settings: await getSiteSettings('draft'),
	published: await getSiteSettings('published')
});

export const actions: Actions = {
	save: async ({ request }) => {
		const formData = await request.formData();
		try {
			await saveSiteSettingsDraft(parseSiteSettings(requireString(formData, 'settings')));
			return { message: 'Paramètres enregistrés.' };
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : 'Enregistrement impossible.'
			});
		}
	},
	publish: async () => {
		try {
			await publishSiteSettings();
			return { message: 'Paramètres publiés.' };
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : 'Publication impossible.'
			});
		}
	}
};
