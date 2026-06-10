import { redirect, type RequestHandler } from '@sveltejs/kit';
import {
	adminSessionCookieName,
	clearAdminSessionCookie,
	deleteAdminSession
} from '$lib/server/auth/session';

export const POST: RequestHandler = async ({ cookies }) => {
	await deleteAdminSession(cookies.get(adminSessionCookieName));
	clearAdminSessionCookie(cookies);
	throw redirect(303, '/admin/login');
};
