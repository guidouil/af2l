import { redirect, type Handle } from '@sveltejs/kit';
import { adminSessionCookieName, readAdminSession } from '$lib/server/auth/session';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.adminUser = await readAdminSession(event.cookies.get(adminSessionCookieName));

	if (event.url.pathname.startsWith('/admin') && event.url.pathname !== '/admin/login') {
		if (!event.locals.adminUser) {
			throw redirect(303, `/admin/login?next=${encodeURIComponent(event.url.pathname)}`);
		}
	}

	return resolve(event);
};
