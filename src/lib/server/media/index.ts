import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { contentPageVersions, mediaAssets } from '$lib/server/db/schema';

const maxUploadBytes = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

export async function listMediaAssets() {
	return db.select().from(mediaAssets).orderBy(mediaAssets.createdAt);
}

export async function getMediaAsset(id: number) {
	const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
	return asset ?? null;
}

export async function uploadMediaAsset(file: File, alt: string) {
	if (!allowedMimeTypes.has(file.type)) {
		throw new Error('Format non supporté. Utilisez PNG, JPEG ou WebP.');
	}

	if (file.size <= 0 || file.size > maxUploadBytes) {
		throw new Error('Le fichier doit peser moins de 5 Mo.');
	}

	const extension = extensionForMime(file.type);
	const filename = `${randomUUID()}${extension}`;
	const directory = uploadDirectory();
	const storagePath = path.join(directory, filename);

	await mkdir(directory, { recursive: true });
	await writeFile(storagePath, Buffer.from(await file.arrayBuffer()));

	const [asset] = await db
		.insert(mediaAssets)
		.values({
			filename,
			originalName: file.name,
			mimeType: file.type,
			byteSize: file.size,
			storagePath,
			alt: alt.trim()
		})
		.returning();

	return asset;
}

export async function deleteMediaAsset(id: number) {
	if (await isMediaAssetReferenced(id)) {
		throw new Error('Ce média est encore utilisé dans une page.');
	}

	const asset = await getMediaAsset(id);
	if (!asset) return;

	await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
	await rm(asset.storagePath, { force: true });
}

export async function isMediaAssetReferenced(id: number) {
	const versions = await db
		.select({ blocks: contentPageVersions.blocks })
		.from(contentPageVersions);

	return versions.some((version) => JSON.stringify(version.blocks).includes(`"mediaId":${id}`));
}

export function uploadDirectory() {
	return path.resolve(process.cwd(), env.UPLOAD_DIR ?? './var/uploads');
}

function extensionForMime(mimeType: string) {
	switch (mimeType) {
		case 'image/png':
			return '.png';
		case 'image/webp':
			return '.webp';
		case 'image/jpeg':
			return '.jpg';
		default:
			return '';
	}
}
