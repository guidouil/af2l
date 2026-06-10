import { sql } from 'drizzle-orm';
import {
	boolean,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex
} from 'drizzle-orm/pg-core';
import type { PageBlock, PageKind, SiteSettings } from '$lib/content/types';
import type { PricingConfig } from '$lib/pricing/types';

export const adminUsers = pgTable(
	'admin_users',
	{
		id: serial('id').primaryKey(),
		email: text('email').notNull(),
		passwordHash: text('password_hash').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [uniqueIndex('admin_users_email_idx').on(table.email)]
);

export const adminSessions = pgTable(
	'admin_sessions',
	{
		id: serial('id').primaryKey(),
		adminUserId: integer('admin_user_id')
			.notNull()
			.references(() => adminUsers.id, { onDelete: 'cascade' }),
		tokenHash: text('token_hash').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [uniqueIndex('admin_sessions_token_hash_idx').on(table.tokenHash)]
);

export const contentPages = pgTable(
	'content_pages',
	{
		id: serial('id').primaryKey(),
		slug: text('slug').notNull(),
		sortOrder: integer('sort_order').notNull().default(0),
		kind: text('kind').$type<PageKind>().notNull().default('standard'),
		showInNav: boolean('show_in_nav').notNull().default(true),
		isSystem: boolean('is_system').notNull().default(false),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [uniqueIndex('content_pages_slug_idx').on(table.slug)]
);

export const contentPageVersions = pgTable('content_page_versions', {
	id: serial('id').primaryKey(),
	pageId: integer('page_id')
		.notNull()
		.references(() => contentPages.id, { onDelete: 'cascade' }),
	status: text('status').$type<'draft' | 'published'>().notNull(),
	title: text('title').notNull(),
	navLabel: text('nav_label').notNull(),
	navNote: text('nav_note').notNull().default(''),
	seoTitle: text('seo_title').notNull(),
	seoDescription: text('seo_description').notNull(),
	blocks: jsonb('blocks')
		.$type<PageBlock[]>()
		.notNull()
		.default(sql`'[]'::jsonb`),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const pricingConfigVersions = pgTable('pricing_config_versions', {
	id: serial('id').primaryKey(),
	status: text('status').$type<'draft' | 'published'>().notNull(),
	config: jsonb('config').$type<PricingConfig>().notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const siteSettingsVersions = pgTable('site_settings_versions', {
	id: serial('id').primaryKey(),
	status: text('status').$type<'draft' | 'published'>().notNull(),
	settings: jsonb('settings').$type<SiteSettings>().notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const mediaAssets = pgTable('media_assets', {
	id: serial('id').primaryKey(),
	filename: text('filename').notNull(),
	originalName: text('original_name').notNull(),
	mimeType: text('mime_type').notNull(),
	byteSize: integer('byte_size').notNull(),
	storagePath: text('storage_path').notNull(),
	alt: text('alt').notNull().default(''),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});
