import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { adminSessions, adminUsers } from '$lib/server/db/schema';

export const adminSessionCookieName = 'afdl_admin_session';
const sessionDays = 7;

export type AdminUser = {
	id: number;
	email: string;
};

export function hashSessionToken(token: string) {
	return createHash('sha256').update(token).digest('hex');
}

export async function createAdminSession(adminUserId: number) {
	const token = randomBytes(32).toString('base64url');
	const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);

	await db.insert(adminSessions).values({
		adminUserId,
		tokenHash: hashSessionToken(token),
		expiresAt
	});

	return { token, expiresAt };
}

export async function readAdminSession(token: string | undefined): Promise<AdminUser | null> {
	if (!token) return null;

	const [session] = await db
		.select({
			id: adminUsers.id,
			email: adminUsers.email
		})
		.from(adminSessions)
		.innerJoin(adminUsers, eq(adminUsers.id, adminSessions.adminUserId))
		.where(
			and(
				eq(adminSessions.tokenHash, hashSessionToken(token)),
				gt(adminSessions.expiresAt, new Date())
			)
		)
		.limit(1);

	return session ?? null;
}

export async function deleteAdminSession(token: string | undefined) {
	if (!token) return;

	await db.delete(adminSessions).where(eq(adminSessions.tokenHash, hashSessionToken(token)));
}

export function setAdminSessionCookie(cookies: Cookies, token: string, expiresAt: Date) {
	cookies.set(adminSessionCookieName, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		expires: expiresAt
	});
}

export function clearAdminSessionCookie(cookies: Cookies) {
	cookies.delete(adminSessionCookieName, { path: '/' });
}
