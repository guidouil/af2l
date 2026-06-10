import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { adminUsers } from '$lib/server/db/schema';
import { verifyPassword } from './password';
import { createAdminSession, setAdminSessionCookie } from './session';
import type { Cookies } from '@sveltejs/kit';

export async function authenticateAdmin(email: string, password: string, cookies: Cookies) {
	const normalizedEmail = normalizeEmail(email);
	const [user] = await db
		.select()
		.from(adminUsers)
		.where(eq(adminUsers.email, normalizedEmail))
		.limit(1);

	if (!user) return false;
	if (!(await verifyPassword(password, user.passwordHash))) return false;

	const session = await createAdminSession(user.id);
	setAdminSessionCookie(cookies, session.token, session.expiresAt);

	return true;
}

export function normalizeEmail(email: string) {
	return email.trim().toLowerCase();
}
