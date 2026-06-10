import { readFileSync } from 'node:fs';
import postgres from 'postgres';
import { defaultPages, defaultSiteSettings } from '../src/lib/content/defaults';
import { defaultPricingConfig } from '../src/lib/pricing/defaults';

loadDotEnv();

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

const sql = postgres(process.env.DATABASE_URL);
const [existingPage] = await sql`select id from content_pages limit 1`;

if (existingPage) {
	console.log('Content already exists; seed skipped.');
	await sql.end();
	process.exit(0);
}

await sql.begin(async (transaction) => {
	for (const page of defaultPages) {
		const [inserted] = await transaction`
			insert into content_pages (slug, sort_order, kind, show_in_nav, is_system)
			values (${page.slug}, ${page.sortOrder}, ${page.kind}, ${page.showInNav}, ${page.isSystem})
			returning id
		`;

		const version = {
			pageId: inserted.id,
			title: page.title,
			navLabel: page.navLabel,
			navNote: page.navNote,
			seoTitle: page.seoTitle,
			seoDescription: page.seoDescription,
			blocks: page.blocks
		};

		await transaction`
			insert into content_page_versions (
				page_id,
				status,
				title,
				nav_label,
				nav_note,
				seo_title,
				seo_description,
				blocks
			)
			values
				(${version.pageId}, 'draft', ${version.title}, ${version.navLabel}, ${version.navNote}, ${version.seoTitle}, ${version.seoDescription}, ${transaction.json(version.blocks)}),
				(${version.pageId}, 'published', ${version.title}, ${version.navLabel}, ${version.navNote}, ${version.seoTitle}, ${version.seoDescription}, ${transaction.json(version.blocks)})
		`;
	}

	await transaction`
		insert into site_settings_versions (status, settings)
		values
			('draft', ${transaction.json(defaultSiteSettings)}),
			('published', ${transaction.json(defaultSiteSettings)})
	`;

	await transaction`
		insert into pricing_config_versions (status, config)
		values
			('draft', ${transaction.json(defaultPricingConfig)}),
			('published', ${transaction.json(defaultPricingConfig)})
	`;
});

await sql.end();
console.log('Default content seeded.');

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
