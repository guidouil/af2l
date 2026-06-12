import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { projectSubmissionFiles, projectSubmissions } from '$lib/server/db/schema';
import { uploadDirectory } from '$lib/server/media';

export const maxProjectFileBytes = 10 * 1024 * 1024;

export const projectSubmissionStatuses = [
	{ value: 'new', label: 'Nouveau' },
	{ value: 'in_progress', label: 'En cours' },
	{ value: 'done', label: 'Terminé' },
	{ value: 'archived', label: 'Archivé' }
] as const;

export type ProjectSubmissionStatus = (typeof projectSubmissionStatuses)[number]['value'];

type StoredProjectFile = {
	filename: string;
	originalName: string;
	mimeType: string;
	byteSize: number;
	storagePath: string;
};

export async function createProjectSubmission(formData: FormData) {
	const fullName = getRequiredText(formData, 'fullName', 'Votre nom complet est requis.');
	const email = getRequiredText(formData, 'email', 'Votre email est requis.');
	const message = getOptionalText(formData, 'message');
	const files = formData
		.getAll('files')
		.filter((value): value is File => value instanceof File && value.name.trim() !== '');

	if (!isValidEmail(email)) {
		throw new Error('Adresse email invalide.');
	}

	if (files.length === 0) {
		throw new Error('Ajoutez au moins un fichier.');
	}

	for (const file of files) {
		if (file.size <= 0) {
			throw new Error(`Le fichier "${file.name}" est vide.`);
		}

		if (file.size > maxProjectFileBytes) {
			throw new Error(`Le fichier "${file.name}" dépasse la limite de 10 Mo.`);
		}
	}

	const storedFiles = await storeProjectFiles(files);

	try {
		await db.transaction(async (tx) => {
			const [submission] = await tx
				.insert(projectSubmissions)
				.values({ fullName, email, message })
				.returning();

			await tx.insert(projectSubmissionFiles).values(
				storedFiles.map((file) => ({
					submissionId: submission.id,
					...file
				}))
			);
		});
	} catch (error) {
		await Promise.all(storedFiles.map((file) => rm(file.storagePath, { force: true })));
		throw error;
	}
}

export async function listProjectSubmissions() {
	const submissions = await db
		.select()
		.from(projectSubmissions)
		.orderBy(desc(projectSubmissions.createdAt), desc(projectSubmissions.id));

	if (submissions.length === 0) return [];

	const files = await db
		.select()
		.from(projectSubmissionFiles)
		.where(
			inArray(
				projectSubmissionFiles.submissionId,
				submissions.map((submission) => submission.id)
			)
		);

	return submissions.map((submission) => ({
		...submission,
		files: files.filter((file) => file.submissionId === submission.id)
	}));
}

export async function getProjectSubmissionFile(id: number) {
	const [file] = await db
		.select()
		.from(projectSubmissionFiles)
		.where(eq(projectSubmissionFiles.id, id))
		.limit(1);

	return file ?? null;
}

export async function updateProjectSubmissionStatus(id: number, status: ProjectSubmissionStatus) {
	if (!isProjectSubmissionStatus(status)) throw new Error('Statut invalide.');

	await db
		.update(projectSubmissions)
		.set({ status, updatedAt: new Date() })
		.where(eq(projectSubmissions.id, id));
}

export async function deleteProjectSubmission(id: number) {
	const files = await db
		.select()
		.from(projectSubmissionFiles)
		.where(eq(projectSubmissionFiles.submissionId, id));

	await db.delete(projectSubmissions).where(eq(projectSubmissions.id, id));
	await Promise.all(files.map((file) => rm(file.storagePath, { force: true })));
}

export function isProjectSubmissionStatus(value: unknown): value is ProjectSubmissionStatus {
	return (
		typeof value === 'string' && projectSubmissionStatuses.some((status) => status.value === value)
	);
}

function getRequiredText(formData: FormData, key: string, message: string) {
	const value = getOptionalText(formData, key);
	if (!value) throw new Error(message);
	return value;
}

function getOptionalText(formData: FormData, key: string) {
	const value = formData.get(key);
	return typeof value === 'string' ? value.trim() : '';
}

function isValidEmail(email: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function storeProjectFiles(files: File[]): Promise<StoredProjectFile[]> {
	const directory = path.join(uploadDirectory(), 'project-submissions');
	await mkdir(directory, { recursive: true });
	const storedFiles: StoredProjectFile[] = [];

	try {
		for (const file of files) {
			const filename = `${randomUUID()}${safeExtension(file.name)}`;
			const storagePath = path.join(directory, filename);
			await writeFile(storagePath, Buffer.from(await file.arrayBuffer()));

			storedFiles.push({
				filename,
				originalName: file.name,
				mimeType: file.type || 'application/octet-stream',
				byteSize: file.size,
				storagePath
			});
		}
	} catch (error) {
		await Promise.all(storedFiles.map((file) => rm(file.storagePath, { force: true })));
		throw error;
	}

	return storedFiles;
}

function safeExtension(filename: string) {
	const extension = path.extname(filename).toLowerCase();
	return /^[a-z0-9._-]{1,16}$/.test(extension) ? extension : '';
}
