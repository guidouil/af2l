import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	deleteProjectSubmission,
	isProjectSubmissionStatus,
	listProjectSubmissions,
	projectSubmissionStatuses,
	updateProjectSubmissionStatus
} from '$lib/server/project-submissions';

export const load: PageServerLoad = async () => {
	return {
		submissions: await listProjectSubmissions(),
		statuses: projectSubmissionStatuses
	};
};

export const actions: Actions = {
	updateStatus: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		const status = formData.get('status');

		if (!Number.isInteger(id) || id <= 0) {
			return fail(400, { message: 'Projet invalide.' });
		}

		if (!isProjectSubmissionStatus(status)) {
			return fail(400, { message: 'Statut invalide.' });
		}

		try {
			await updateProjectSubmissionStatus(id, status);
			return { message: 'Statut mis à jour.' };
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : 'Mise à jour impossible.'
			});
		}
	},
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!Number.isInteger(id) || id <= 0) {
			return fail(400, { message: 'Projet invalide.' });
		}

		try {
			await deleteProjectSubmission(id);
			return { message: 'Projet supprimé.' };
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : 'Suppression impossible.'
			});
		}
	}
};
