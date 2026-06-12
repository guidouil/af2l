import type { PageBlock, PageKind, SiteSettings } from '$lib/content/types';
import { getPageKindBlockErrors, isPageBlockType, isPageKind } from '$lib/content/page-types';
import { defaultPricingConfig } from '$lib/pricing/defaults';
import type { PricingConfig } from '$lib/pricing/types';

export function normalizeSlug(slug: string) {
	return slug
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function parseBoolean(value: FormDataEntryValue | null) {
	return value === 'on' || value === 'true' || value === '1';
}

export function requireString(formData: FormData, key: string) {
	const value = formData.get(key);
	return typeof value === 'string' ? value.trim() : '';
}

export function parsePageKind(value: string): PageKind {
	return isPageKind(value) ? value : 'standard';
}

export function parseBlocks(raw: string): PageBlock[] {
	const parsed = JSON.parse(raw) as unknown;
	if (!Array.isArray(parsed)) throw new Error('Les blocs doivent former un tableau.');

	return parsed.map((block) => {
		if (
			!isRecord(block) ||
			typeof block.id !== 'string' ||
			typeof block.type !== 'string' ||
			!isPageBlockType(block.type)
		) {
			throw new Error('Un bloc est invalide.');
		}

		return block as PageBlock;
	});
}

export function validateBlocksForPageKind(kind: PageKind, blocks: PageBlock[]) {
	const errors = getPageKindBlockErrors(kind, blocks);
	if (errors.length > 0) throw new Error(errors.join(' '));
}

export function parseSiteSettings(raw: string): SiteSettings {
	const parsed = JSON.parse(raw) as unknown;
	if (!isRecord(parsed)) throw new Error('Les paramètres sont invalides.');

	return {
		siteName: String(parsed.siteName ?? '').trim(),
		siteDescription: String(parsed.siteDescription ?? '').trim(),
		coverLogoLight: String(parsed.coverLogoLight ?? '').trim(),
		coverLogoDark: String(parsed.coverLogoDark ?? '').trim(),
		ogImage: String(parsed.ogImage ?? '').trim()
	};
}

export function parsePricingConfig(raw: string): PricingConfig {
	const parsed = JSON.parse(raw) as unknown;
	if (!isRecord(parsed)) throw new Error('La configuration tarifaire est invalide.');

	const config = parsed as PricingConfig;
	const hasIsbnRule = config.rules.some((rule) => rule.id === 'isbn');

	return {
		...config,
		defaults: {
			...defaultPricingConfig.defaults,
			...config.defaults
		},
		isbnOptions: config.isbnOptions ?? defaultPricingConfig.isbnOptions,
		rules: hasIsbnRule
			? config.rules
			: [...config.rules, ...defaultPricingConfig.rules.filter((rule) => rule.id === 'isbn')]
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
