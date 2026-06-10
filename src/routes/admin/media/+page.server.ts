import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	deleteMediaAsset,
	isMediaAssetReferenced,
	listMediaAssets,
	uploadMediaAsset
} from '$lib/server/media';
import { requireString } from '$lib/server/content/validation';

export const load: PageServerLoad = async () => {
	const media = await listMediaAssets();

	return {
		media: await Promise.all(
			media.map(async (asset) => ({
				...asset,
				isReferenced: await isMediaAssetReferenced(asset.id)
			}))
		)
	};
};

export const actions: Actions = {
	upload: async ({ request }) => {
		const formData = await request.formData();
		const file = formData.get('file');

		if (!(file instanceof File)) return fail(400, { message: 'Fichier requis.' });

		try {
			await uploadMediaAsset(file, requireString(formData, 'alt'));
			return { message: 'Média ajouté.' };
		} catch (error) {
			return fail(400, { message: error instanceof Error ? error.message : 'Upload impossible.' });
		}
	},
	delete: async ({ request }) => {
		const formData = await request.formData();
		try {
			await deleteMediaAsset(Number(formData.get('id')));
			return { message: 'Média supprimé.' };
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : 'Suppression impossible.'
			});
		}
	}
};
