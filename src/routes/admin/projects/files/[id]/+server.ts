import { readFile } from 'node:fs/promises';
import { error, type RequestHandler } from '@sveltejs/kit';
import { getProjectSubmissionFile } from '$lib/server/project-submissions';

export const GET: RequestHandler = async ({ params }) => {
	const file = await getProjectSubmissionFile(Number(params.id));
	if (!file) error(404, 'File not found');

	try {
		const body = await readFile(file.storagePath);

		return new Response(body, {
			headers: {
				'content-type': file.mimeType,
				'content-length': String(file.byteSize),
				'content-disposition': contentDisposition(file.originalName),
				'cache-control': 'private, no-store'
			}
		});
	} catch {
		error(404, 'File not found');
	}
};

function contentDisposition(filename: string) {
	const fallback = filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
	return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeRFC5987(filename)}`;
}

function encodeRFC5987(value: string) {
	return encodeURIComponent(value).replace(
		/['()*]/g,
		(char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
	);
}
