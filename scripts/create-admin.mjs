import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { promisify } from 'node:util';
import postgres from 'postgres';

loadDotEnv();

const scrypt = promisify(scryptCallback);
const databaseUrl = process.env.DATABASE_URL;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!databaseUrl) throw new Error('DATABASE_URL is required');
if (!email) throw new Error('ADMIN_EMAIL is required');
if (!password || password.length < 10)
	throw new Error('ADMIN_PASSWORD must contain at least 10 characters');

const sql = postgres(databaseUrl);
const passwordHash = await hashPassword(password);

await sql`
	insert into admin_users (email, password_hash, updated_at)
	values (${email}, ${passwordHash}, now())
	on conflict (email)
	do update set password_hash = excluded.password_hash, updated_at = now()
`;

await sql.end();
console.log(`Admin account ready: ${email}`);

async function hashPassword(value) {
	const salt = randomBytes(16).toString('hex');
	const key = await scrypt(value, salt, 64);
	return `scrypt:${salt}:${key.toString('hex')}`;
}

function loadDotEnv() {
	try {
		const env = readFileSync('.env', 'utf8');
		for (const line of env.split(/\r?\n/)) {
			const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
			if (!match || process.env[match[1]]) continue;
			process.env[match[1]] = match[2].replace(/^"|"$/g, '');
		}
	} catch {
		// .env is optional; production can provide real environment variables.
	}
}
