export type PageKind = 'cover' | 'standard' | 'catalogue' | 'pricing' | 'contact' | 'back_cover';

export type HeroBlock = {
	id: string;
	type: 'hero';
	eyebrow?: string;
	title: string;
	body?: string;
	buttonLabel?: string;
	targetSlug?: string;
};

export type ParagraphsBlock = {
	id: string;
	type: 'paragraphs';
	eyebrow?: string;
	title?: string;
	paragraphs: string[];
};

export type ListBlock = {
	id: string;
	type: 'list';
	eyebrow?: string;
	title: string;
	intro?: string;
	items: string[];
};

export type CatalogueCardsBlock = {
	id: string;
	type: 'catalogueCards';
	eyebrow?: string;
	title: string;
	cards: {
		tag: string;
		title: string;
		author: string;
		status: string;
	}[];
	note?: string;
	ctaLabel?: string;
	targetSlug?: string;
};

export type ContactLinksBlock = {
	id: string;
	type: 'contactLinks';
	eyebrow?: string;
	title: string;
	links: {
		label: string;
		href: string;
		text: string;
	}[];
	ctaLabel?: string;
	targetSlug?: string;
};

export type PricingConfiguratorBlock = {
	id: string;
	type: 'pricingConfigurator';
	eyebrow?: string;
	title: string;
	lead: string;
};

export type ImageBlock = {
	id: string;
	type: 'image';
	mediaId?: number;
	src?: string;
	alt: string;
	caption?: string;
};

export type CtaBlock = {
	id: string;
	type: 'cta';
	label: string;
	targetSlug?: string;
};

export type PageBlock =
	| HeroBlock
	| ParagraphsBlock
	| ListBlock
	| CatalogueCardsBlock
	| ContactLinksBlock
	| PricingConfiguratorBlock
	| ImageBlock
	| CtaBlock;

export type SiteSettings = {
	siteName: string;
	siteDescription: string;
	coverLogoLight: string;
	coverLogoDark: string;
	ogImage: string;
};

export type PublishedPage = {
	id: number;
	slug: string;
	title: string;
	navLabel: string;
	navNote: string;
	seoTitle: string;
	seoDescription: string;
	sortOrder: number;
	kind: PageKind;
	showInNav: boolean;
	isSystem: boolean;
	blocks: PageBlock[];
};

export type PublishedBook = {
	settings: SiteSettings;
	pages: PublishedPage[];
};

export type ContentStatus = 'draft' | 'published';
