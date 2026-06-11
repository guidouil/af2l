import type { PageBlock, PageKind } from './types';

export type PageBlockType = PageBlock['type'];

export type BlockTypeDefinition = {
	value: PageBlockType;
	label: string;
};

export type PageKindDefinition = {
	value: PageKind;
	label: string;
	description: string;
	allowedBlockTypes: PageBlockType[];
	starterBlockType: PageBlockType;
	defaultShowInNav: boolean;
};

export const blockTypeDefinitions: BlockTypeDefinition[] = [
	{ value: 'hero', label: 'Accroche' },
	{ value: 'paragraphs', label: 'Paragraphes' },
	{ value: 'list', label: 'Liste' },
	{ value: 'catalogueCards', label: 'Catalogue' },
	{ value: 'contactLinks', label: 'Contacts' },
	{ value: 'pricingConfigurator', label: 'Configurateur tarifs' },
	{ value: 'image', label: 'Image' },
	{ value: 'cta', label: 'Bouton' }
];

export const pageKindDefinitions: PageKindDefinition[] = [
	{
		value: 'cover',
		label: 'Couverture',
		description: "Page d'accueil ou entrée principale, centrée sur une accroche forte.",
		allowedBlockTypes: ['hero', 'image', 'cta'],
		starterBlockType: 'hero',
		defaultShowInNav: false
	},
	{
		value: 'standard',
		label: 'Page éditoriale',
		description: 'Page de contenu libre pour textes, listes, images et appels à action.',
		allowedBlockTypes: ['hero', 'paragraphs', 'list', 'image', 'cta'],
		starterBlockType: 'paragraphs',
		defaultShowInNav: true
	},
	{
		value: 'catalogue',
		label: 'Catalogue',
		description: 'Page dédiée aux livres, parutions ou projets accompagnés.',
		allowedBlockTypes: ['catalogueCards', 'paragraphs', 'image', 'cta'],
		starterBlockType: 'catalogueCards',
		defaultShowInNav: true
	},
	{
		value: 'pricing',
		label: 'Tarifs',
		description: 'Page qui affiche le configurateur tarifaire public.',
		allowedBlockTypes: ['pricingConfigurator', 'paragraphs', 'list', 'cta'],
		starterBlockType: 'pricingConfigurator',
		defaultShowInNav: true
	},
	{
		value: 'contact',
		label: 'Contact',
		description: 'Page de prise de contact, avec liens et coordonnées.',
		allowedBlockTypes: ['contactLinks', 'paragraphs', 'image', 'cta'],
		starterBlockType: 'contactLinks',
		defaultShowInNav: true
	},
	{
		value: 'back_cover',
		label: 'Dos',
		description: 'Page de fin, mentions ou contact secondaire, hors navigation par défaut.',
		allowedBlockTypes: ['contactLinks', 'paragraphs', 'image', 'cta'],
		starterBlockType: 'contactLinks',
		defaultShowInNav: false
	}
];

export function isPageKind(value: string): value is PageKind {
	return pageKindDefinitions.some((definition) => definition.value === value);
}

export function isPageBlockType(value: string): value is PageBlockType {
	return blockTypeDefinitions.some((definition) => definition.value === value);
}

export function getPageKindDefinition(kind: PageKind): PageKindDefinition {
	return (
		pageKindDefinitions.find((definition) => definition.value === kind) ??
		pageKindDefinitions.find((definition) => definition.value === 'standard')!
	);
}

export function getBlockTypeLabel(type: PageBlockType) {
	return blockTypeDefinitions.find((definition) => definition.value === type)?.label ?? type;
}

export function isBlockAllowedForPageKind(kind: PageKind, type: PageBlockType) {
	return getPageKindDefinition(kind).allowedBlockTypes.includes(type);
}

export function getPageKindBlockErrors(kind: PageKind, blocks: PageBlock[]) {
	const invalidLabels = Array.from(
		new Set(
			blocks
				.filter((block) => !isBlockAllowedForPageKind(kind, block.type))
				.map((block) => getBlockTypeLabel(block.type))
		)
	);

	if (invalidLabels.length === 0) return [];

	const definition = getPageKindDefinition(kind);
	return [
		`Le type "${definition.label}" n'accepte pas les blocs suivants : ${invalidLabels.join(', ')}.`
	];
}

export function createEmptyBlock(type: PageBlockType, id: string, title = 'Titre'): PageBlock {
	if (type === 'hero') return { id, type, title, body: '', buttonLabel: '', targetSlug: '' };
	if (type === 'paragraphs') return { id, type, title, paragraphs: ['Nouveau texte.'] };
	if (type === 'list') return { id, type, title: 'Liste', items: ['Premier élément'] };
	if (type === 'catalogueCards') return { id, type, title: 'Catalogue', cards: [] };
	if (type === 'contactLinks') return { id, type, title: 'Contacts', links: [] };
	if (type === 'pricingConfigurator') return { id, type, title: 'Configurateur de prix', lead: '' };
	if (type === 'image') return { id, type, alt: '', caption: '' };
	return { id, type, label: 'Lire la suite', targetSlug: '' };
}

export function normalizePageKind(kind: string, slug: string, blocks: PageBlock[]): PageKind {
	if (isPageKind(kind) && kind !== 'standard') return kind;
	if (slug === '') return 'cover';
	if (slug === 'tarifs' || blocks.some((block) => block.type === 'pricingConfigurator')) {
		return 'pricing';
	}
	if (slug === 'livres' || blocks.some((block) => block.type === 'catalogueCards')) {
		return 'catalogue';
	}
	if (slug === 'contact') return 'contact';
	return 'standard';
}
