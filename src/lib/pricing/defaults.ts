import type { PricingConfig } from './types';

export const defaultPricingConfig: PricingConfig = {
	signsPerPage: 1500,
	defaults: {
		projectType: 'paper',
		bookCategory: 'fiction',
		volumeInput: 'pages',
		pageCount: 120,
		signCount: 180000,
		illustrationCount: 0,
		wantsCorrection: true,
		coverOption: 'supplied-illustration',
		hasFootnotes: false,
		hasIndex: false,
		hasComplexIndex: false,
		hasSummary: true,
		tableCount: 0,
		publicationOption: 'none'
	},
	projectTypes: [
		{ value: 'paper', label: 'Livre papier' },
		{ value: 'epub', label: 'Livre numérique (ePub)' },
		{ value: 'paper-epub', label: 'Livre papier + numérique' }
	],
	bookCategories: [
		{ value: 'fiction', label: 'Roman / Nouvelle' },
		{ value: 'essay', label: 'Essai / Document' },
		{ value: 'illustrated', label: 'Livre illustré' },
		{ value: 'youth', label: 'Livre jeunesse' },
		{ value: 'poetry', label: 'Recueil de poésie' },
		{ value: 'art-book', label: "Beau livre / Livre d'art" }
	],
	coverOptions: [
		{ value: 'ready-pdf', label: 'PDF complet prêt pour impression', price: 0 },
		{ value: 'supplied-illustration', label: 'Illustration fournie', price: 120 },
		{ value: 'full-creation', label: 'Création complète', price: 180 }
	],
	publicationOptions: [
		{ value: 'kdp', label: 'KDP', price: 50 },
		{ value: 'bod', label: 'BoD', price: 99 },
		{ value: 'kdp-bod', label: 'KDP + BoD', price: 149 },
		{ value: 'none', label: 'Pas de publication', price: 0 }
	],
	rules: [
		{
			id: 'layout',
			label: 'Mise en page',
			key: 'layout',
			type: 'per_estimated_page',
			amount: 1.5,
			minimum: 90
		},
		{
			id: 'correction',
			label: 'Correction',
			key: 'correction',
			type: 'per_estimated_page',
			amount: 1.25,
			condition: 'wantsCorrection'
		},
		{
			id: 'illustrations',
			label: 'Illustrations',
			key: 'illustrations',
			type: 'per_quantity',
			amount: 10,
			input: 'illustrationCount'
		},
		{
			id: 'tables',
			label: 'Tableaux',
			key: 'tables',
			type: 'per_quantity',
			amount: 5,
			input: 'tableCount'
		},
		{
			id: 'footnotes',
			label: 'Notes',
			key: 'footnotes',
			type: 'flat_if',
			amount: 50,
			condition: 'hasFootnotes'
		},
		{
			id: 'index',
			label: 'Index',
			key: 'index',
			type: 'range_by_pages_if',
			condition: 'hasIndex',
			tiers: [{ upTo: 100, amount: 80 }, { upTo: 200, amount: 120 }, { amount: 180 }]
		},
		{
			id: 'cover',
			label: 'Couverture',
			key: 'cover',
			type: 'flat_option_price',
			input: 'coverOption',
			optionGroup: 'coverOptions'
		},
		{
			id: 'epub',
			label: 'ePub',
			key: 'epub',
			type: 'flat_if',
			amount: 75,
			condition: 'projectType:epub-or-paper-epub'
		},
		{
			id: 'epub-cover-adaptation',
			label: 'Adaptation couverture ePub',
			key: 'epub',
			type: 'flat_if',
			amount: 30,
			condition: 'paperEpubWithCustomCover'
		},
		{
			id: 'publication',
			label: 'Publication',
			key: 'publication',
			type: 'flat_option_price',
			input: 'publicationOption',
			optionGroup: 'publicationOptions'
		},
		{
			id: 'art-book-quote',
			label: 'Beau livre sur devis',
			type: 'quote_if',
			condition: 'bookCategory:art-book'
		},
		{
			id: 'complex-index-quote',
			label: 'Index complexe sur devis',
			type: 'quote_if',
			condition: 'complexIndex'
		}
	]
};
