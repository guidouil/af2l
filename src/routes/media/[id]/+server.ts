import { readFile } from 'node:fs/promises';
import { error, type RequestHandler } from '@sveltejs/kit';
import { getMediaAsset } from '$lib/server/media';

export const GET: RequestHandler = async ({ params }) => {
	const asset = await getMediaAsset(Number(params.id));
	if (!asset) error(404, 'Media not found');

	try {
		const body = await readFile(asset.storagePath);
		return new Response(body, {
			headers: {
				'content-type': asset.mimeType,
				'cache-control': 'public, max-age=31536000, immutable'
			}
		});
	} catch {
		error(404, 'Media file not found');
	}
};
