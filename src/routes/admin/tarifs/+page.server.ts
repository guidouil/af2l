import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getPricingConfig, publishPricingConfig, savePricingDraft } from '$lib/server/content';
import { parsePricingConfig, requireString } from '$lib/server/content/validation';

export const load: PageServerLoad = async () => ({
	config: await getPricingConfig('draft'),
	published: await getPricingConfig('published')
});

export const actions: Actions = {
	save: async ({ request }) => {
		const formData = await request.formData();
		try {
			await savePricingDraft(parsePricingConfig(requireString(formData, 'config')));
			return { message: 'Brouillon tarifaire enregistré.' };
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : 'Enregistrement impossible.'
			});
		}
	},
	publish: async () => {
		try {
			await publishPricingConfig();
			return { message: 'Tarifs publiés.' };
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : 'Publication impossible.'
			});
		}
	}
};
