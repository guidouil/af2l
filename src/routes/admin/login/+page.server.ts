import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { authenticateAdmin } from '$lib/server/auth';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.adminUser) throw redirect(303, url.searchParams.get('next') || '/admin');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '');
		const password = String(formData.get('password') ?? '');

		if (!(await authenticateAdmin(email, password, cookies))) {
			return fail(400, { message: 'Identifiants invalides.', email });
		}

		throw redirect(303, url.searchParams.get('next') || '/admin');
	}
};
