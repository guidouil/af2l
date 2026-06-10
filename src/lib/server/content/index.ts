import { and, asc, desc, eq, max, ne } from 'drizzle-orm';
import { defaultBook, defaultPages, defaultSiteSettings } from '$lib/content/defaults';
import type {
	ContentStatus,
	PageBlock,
	PublishedBook,
	PublishedPage,
	SiteSettings
} from '$lib/content/types';
import { defaultPricingConfig } from '$lib/pricing/defaults';
import type { PricingConfig } from '$lib/pricing/types';
import { db } from '$lib/server/db';
import {
	contentPageVersions,
	contentPages,
	pricingConfigVersions,
	siteSettingsVersions
} from '$lib/server/db/schema';

export type AdminPageSummary = {
	id: number;
	slug: string;
	sortOrder: number;
	kind: PublishedPage['kind'];
	showInNav: boolean;
	isSystem: boolean;
	draft: PageVersion | null;
	published: PageVersion | null;
};

export type PageVersion = {
	id: number;
	status: ContentStatus;
	title: string;
	navLabel: string;
	navNote: string;
	seoTitle: string;
	seoDescription: string;
	blocks: PageBlock[];
	updatedAt: Date;
};

export async function getPublishedBook(): Promise<PublishedBook> {
	return getBookByStatus('published', true);
}

export async function getDraftBook(): Promise<PublishedBook> {
	return getBookByStatus('draft', true);
}

export async function getAdminPages(): Promise<AdminPageSummary[]> {
	const pages = await db
		.select()
		.from(contentPages)
		.orderBy(asc(contentPages.sortOrder), asc(contentPages.id));
	const versions = await db.select().from(contentPageVersions);
	const versionMap = new Map<string, PageVersion>();

	for (const version of versions) {
		versionMap.set(`${version.pageId}:${version.status}`, {
			id: version.id,
			status: version.status,
			title: version.title,
			navLabel: version.navLabel,
			navNote: version.navNote,
			seoTitle: version.seoTitle,
			seoDescription: version.seoDescription,
			blocks: version.blocks,
			updatedAt: version.updatedAt
		});
	}

	return pages.map((page) => ({
		id: page.id,
		slug: page.slug,
		sortOrder: page.sortOrder,
		kind: page.kind,
		showInNav: page.showInNav,
		isSystem: page.isSystem,
		draft: versionMap.get(`${page.id}:draft`) ?? null,
		published: versionMap.get(`${page.id}:published`) ?? null
	}));
}

export async function getAdminPage(id: number) {
	const [page] = await db.select().from(contentPages).where(eq(contentPages.id, id)).limit(1);
	if (!page) return null;

	const versions = await db
		.select()
		.from(contentPageVersions)
		.where(eq(contentPageVersions.pageId, id));
	const draft = versions.find((version) => version.status === 'draft');
	const published = versions.find((version) => version.status === 'published');

	return {
		id: page.id,
		slug: page.slug,
		sortOrder: page.sortOrder,
		kind: page.kind,
		showInNav: page.showInNav,
		isSystem: page.isSystem,
		draft: draft ? toPageVersion(draft) : null,
		published: published ? toPageVersion(published) : null
	};
}

export async function createContentPage(input: {
	title: string;
	slug: string;
	navLabel: string;
	navNote: string;
	seoTitle: string;
	seoDescription: string;
}) {
	const [existing] = await db
		.select()
		.from(contentPages)
		.where(eq(contentPages.slug, input.slug))
		.limit(1);
	if (existing) throw new Error('Ce slug existe déjà.');

	const [orderRow] = await db.select({ maxOrder: max(contentPages.sortOrder) }).from(contentPages);
	const sortOrder = (orderRow.maxOrder ?? -1) + 1;

	return db.transaction(async (tx) => {
		const [page] = await tx
			.insert(contentPages)
			.values({
				slug: input.slug,
				sortOrder,
				kind: 'standard',
				showInNav: true,
				isSystem: false
			})
			.returning();

		await tx.insert(contentPageVersions).values({
			pageId: page.id,
			status: 'draft',
			title: input.title,
			navLabel: input.navLabel,
			navNote: input.navNote,
			seoTitle: input.seoTitle,
			seoDescription: input.seoDescription,
			blocks: [
				{
					id: `paragraphs-${Date.now()}`,
					type: 'paragraphs',
					eyebrow: input.navLabel,
					title: input.title,
					paragraphs: ['Nouveau contenu à compléter.']
				}
			]
		});

		return page;
	});
}

export async function updateContentPageDraft(
	id: number,
	input: {
		slug: string;
		kind: PublishedPage['kind'];
		showInNav: boolean;
		title: string;
		navLabel: string;
		navNote: string;
		seoTitle: string;
		seoDescription: string;
		blocks: PageBlock[];
	}
) {
	const [duplicate] = await db
		.select()
		.from(contentPages)
		.where(and(eq(contentPages.slug, input.slug), ne(contentPages.id, id)))
		.limit(1);
	if (duplicate) throw new Error('Ce slug existe déjà.');

	await db.transaction(async (tx) => {
		await tx
			.update(contentPages)
			.set({
				slug: input.slug,
				kind: input.kind,
				showInNav: input.showInNav,
				updatedAt: new Date()
			})
			.where(eq(contentPages.id, id));

		const [draft] = await tx
			.select()
			.from(contentPageVersions)
			.where(and(eq(contentPageVersions.pageId, id), eq(contentPageVersions.status, 'draft')))
			.limit(1);

		const values = {
			title: input.title,
			navLabel: input.navLabel,
			navNote: input.navNote,
			seoTitle: input.seoTitle,
			seoDescription: input.seoDescription,
			blocks: input.blocks,
			updatedAt: new Date()
		};

		if (draft) {
			await tx.update(contentPageVersions).set(values).where(eq(contentPageVersions.id, draft.id));
		} else {
			await tx.insert(contentPageVersions).values({
				pageId: id,
				status: 'draft',
				...values
			});
		}
	});
}

export async function publishContentPage(id: number) {
	await db.transaction(async (tx) => {
		const [draft] = await tx
			.select()
			.from(contentPageVersions)
			.where(and(eq(contentPageVersions.pageId, id), eq(contentPageVersions.status, 'draft')))
			.limit(1);

		if (!draft) throw new Error('Aucun brouillon à publier.');

		const [published] = await tx
			.select()
			.from(contentPageVersions)
			.where(and(eq(contentPageVersions.pageId, id), eq(contentPageVersions.status, 'published')))
			.limit(1);

		const values = {
			title: draft.title,
			navLabel: draft.navLabel,
			navNote: draft.navNote,
			seoTitle: draft.seoTitle,
			seoDescription: draft.seoDescription,
			blocks: draft.blocks,
			updatedAt: new Date()
		};

		if (published) {
			await tx
				.update(contentPageVersions)
				.set(values)
				.where(eq(contentPageVersions.id, published.id));
		} else {
			await tx.insert(contentPageVersions).values({
				pageId: id,
				status: 'published',
				...values
			});
		}
	});
}

export async function moveContentPage(id: number, direction: 'up' | 'down') {
	const pages = await db
		.select()
		.from(contentPages)
		.orderBy(asc(contentPages.sortOrder), asc(contentPages.id));
	const index = pages.findIndex((page) => page.id === id);
	const targetIndex = direction === 'up' ? index - 1 : index + 1;
	if (index < 0 || targetIndex < 0 || targetIndex >= pages.length) return;

	const current = pages[index];
	const target = pages[targetIndex];

	await db.transaction(async (tx) => {
		await tx
			.update(contentPages)
			.set({ sortOrder: target.sortOrder, updatedAt: new Date() })
			.where(eq(contentPages.id, current.id));
		await tx
			.update(contentPages)
			.set({ sortOrder: current.sortOrder, updatedAt: new Date() })
			.where(eq(contentPages.id, target.id));
	});
}

export async function deleteContentPage(id: number) {
	const [page] = await db.select().from(contentPages).where(eq(contentPages.id, id)).limit(1);
	if (!page) return;
	if (page.isSystem) throw new Error('Cette page système ne peut pas être supprimée.');

	await db.delete(contentPages).where(eq(contentPages.id, id));
}

export async function getSiteSettings(status: ContentStatus = 'published') {
	const [version] = await db
		.select()
		.from(siteSettingsVersions)
		.where(eq(siteSettingsVersions.status, status))
		.orderBy(desc(siteSettingsVersions.updatedAt))
		.limit(1);

	if (version) return version.settings;
	if (status === 'draft') return getSiteSettings('published');
	return defaultSiteSettings;
}

export async function saveSiteSettingsDraft(settings: SiteSettings) {
	await upsertSiteSettings('draft', settings);
}

export async function publishSiteSettings() {
	const settings = await getSiteSettings('draft');
	await upsertSiteSettings('published', settings);
}

export async function getPricingConfig(status: ContentStatus = 'published') {
	const [version] = await db
		.select()
		.from(pricingConfigVersions)
		.where(eq(pricingConfigVersions.status, status))
		.orderBy(desc(pricingConfigVersions.updatedAt))
		.limit(1);

	if (version) return version.config;
	if (status === 'draft') return getPricingConfig('published');
	return defaultPricingConfig;
}

export async function savePricingDraft(config: PricingConfig) {
	await upsertPricingConfig('draft', config);
}

export async function publishPricingConfig() {
	const config = await getPricingConfig('draft');
	await upsertPricingConfig('published', config);
}

export async function seedDefaultContent() {
	const [existingPage] = await db.select().from(contentPages).limit(1);
	if (existingPage) return false;

	await db.transaction(async (tx) => {
		for (const page of defaultPages) {
			const [inserted] = await tx
				.insert(contentPages)
				.values({
					slug: page.slug,
					sortOrder: page.sortOrder,
					kind: page.kind,
					showInNav: page.showInNav,
					isSystem: page.isSystem
				})
				.returning();

			const version = {
				pageId: inserted.id,
				title: page.title,
				navLabel: page.navLabel,
				navNote: page.navNote,
				seoTitle: page.seoTitle,
				seoDescription: page.seoDescription,
				blocks: page.blocks
			};

			await tx.insert(contentPageVersions).values([
				{ ...version, status: 'draft' },
				{ ...version, status: 'published' }
			]);
		}

		await tx.insert(siteSettingsVersions).values([
			{ status: 'draft', settings: defaultSiteSettings },
			{ status: 'published', settings: defaultSiteSettings }
		]);
		await tx.insert(pricingConfigVersions).values([
			{ status: 'draft', config: defaultPricingConfig },
			{ status: 'published', config: defaultPricingConfig }
		]);
	});

	return true;
}

async function getBookByStatus(
	status: ContentStatus,
	fallbackToDefaults: boolean
): Promise<PublishedBook> {
	const settings = await getSiteSettings(status);
	const rows = await db
		.select({ page: contentPages, version: contentPageVersions })
		.from(contentPages)
		.innerJoin(
			contentPageVersions,
			and(eq(contentPageVersions.pageId, contentPages.id), eq(contentPageVersions.status, status))
		)
		.orderBy(asc(contentPages.sortOrder), asc(contentPages.id));

	if (rows.length === 0 && fallbackToDefaults) return defaultBook;

	return {
		settings,
		pages: rows.map(({ page, version }) => ({
			id: page.id,
			slug: page.slug,
			title: version.title,
			navLabel: version.navLabel,
			navNote: version.navNote,
			seoTitle: version.seoTitle,
			seoDescription: version.seoDescription,
			sortOrder: page.sortOrder,
			kind: page.kind,
			showInNav: page.showInNav,
			isSystem: page.isSystem,
			blocks: version.blocks
		}))
	};
}

async function upsertSiteSettings(status: ContentStatus, settings: SiteSettings) {
	const [existing] = await db
		.select()
		.from(siteSettingsVersions)
		.where(eq(siteSettingsVersions.status, status))
		.limit(1);

	if (existing) {
		await db
			.update(siteSettingsVersions)
			.set({ settings, updatedAt: new Date() })
			.where(eq(siteSettingsVersions.id, existing.id));
	} else {
		await db.insert(siteSettingsVersions).values({ status, settings });
	}
}

async function upsertPricingConfig(status: ContentStatus, config: PricingConfig) {
	const [existing] = await db
		.select()
		.from(pricingConfigVersions)
		.where(eq(pricingConfigVersions.status, status))
		.limit(1);

	if (existing) {
		await db
			.update(pricingConfigVersions)
			.set({ config, updatedAt: new Date() })
			.where(eq(pricingConfigVersions.id, existing.id));
	} else {
		await db.insert(pricingConfigVersions).values({ status, config });
	}
}

function toPageVersion(version: typeof contentPageVersions.$inferSelect): PageVersion {
	return {
		id: version.id,
		status: version.status,
		title: version.title,
		navLabel: version.navLabel,
		navNote: version.navNote,
		seoTitle: version.seoTitle,
		seoDescription: version.seoDescription,
		blocks: version.blocks,
		updatedAt: version.updatedAt
	};
}
