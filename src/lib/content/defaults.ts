import type { PublishedBook, PublishedPage, SiteSettings } from './types';

export const defaultSiteSettings: SiteSettings = {
	siteName: 'À fleur de lignes',
	siteDescription:
		'Création, mise en page et publication de livres papier et numériques pour auteurs et maisons d’édition.',
	coverLogoLight: '/assets/brand/logo-light.png',
	coverLogoDark: '/assets/brand/logo-dark.png',
	ogImage: '/og-image.png'
};

export const defaultPages: PublishedPage[] = [
	{
		id: 1,
		slug: '',
		title: 'Accueil',
		navLabel: 'Accueil',
		navNote: "Maison d'édition",
		seoTitle: 'À fleur de lignes',
		seoDescription: defaultSiteSettings.siteDescription,
		sortOrder: 0,
		kind: 'cover',
		showInNav: false,
		isSystem: true,
		blocks: [
			{
				id: 'cover-hero',
				type: 'hero',
				eyebrow: "Maison d'édition indépendante",
				title: 'À fleur de lignes',
				body: 'Mise en page, couverture, EPUB et accompagnement de publication pour auteurs et projets éditoriaux.',
				buttonLabel: 'Découvrir les livres',
				targetSlug: 'livres'
			}
		]
	},
	{
		id: 2,
		slug: 'a-propos',
		title: 'À propos',
		navLabel: 'À propos',
		navNote: 'Création et publication',
		seoTitle: 'À propos | À fleur de lignes',
		seoDescription: defaultSiteSettings.siteDescription,
		sortOrder: 1,
		kind: 'standard',
		showInNav: true,
		isSystem: false,
		blocks: [
			{
				id: 'about-1',
				type: 'paragraphs',
				eyebrow: 'À propos',
				title: 'Créer des livres avec exigence, clarté et attention.',
				paragraphs: [
					'A fleur de lignes est né d’une volonté simple : rendre la création et la publication d’un livre accessibles aux auteurs tout en conservant un niveau de qualité professionnel.',
					"Depuis plusieurs années, j'accompagne des projets éditoriaux à travers la création de couvertures, la mise en page, la préparation des fichiers pour l’impression et la publication. À ce jour, j’ai participé à la réalisation d’une cinquantaine d’ouvrages en collaboration avec leurs auteurs ainsi qu’avec une maison d’édition indépendante.",
					'Mon parcours m’a également permis de découvrir le livre sous un autre angle grâce à près de dix années d’expérience en librairie. Cette double approche me donne une vision globale de la chaîne du livre, de sa conception jusqu’à sa rencontre avec les lecteurs.',
					'J’accompagne aujourd’hui les auteurs et porteurs de projets à chaque étape de leur publication : mise en page, préparation des illustrations, création de couverture, contrôle des fichiers d’impression, création de livres numériques EPUB et publication sur les plateformes KDP et BoD.',
					'Chaque projet est unique et bénéficie d’un suivi attentif, avec une approche à la fois humaine, rigoureuse et artisanale.'
				]
			},
			{ id: 'about-cta', type: 'cta', label: 'Voir les livres', targetSlug: 'livres' }
		]
	},
	{
		id: 3,
		slug: 'livres',
		title: 'Livres',
		navLabel: 'Livres',
		navNote: 'Parutions et projets',
		seoTitle: 'Livres | À fleur de lignes',
		seoDescription: defaultSiteSettings.siteDescription,
		sortOrder: 2,
		kind: 'catalogue',
		showInNav: true,
		isSystem: false,
		blocks: [
			{
				id: 'catalogue-cards',
				type: 'catalogueCards',
				eyebrow: 'Livres',
				title: 'Livres à paraître et projets accompagnés',
				cards: [
					{
						title: 'Plume et ses compagnons',
						author: 'Marc BAUDRILLARD',
						tag: 'Livre pour enfants',
						status: 'Déjà en librairie'
					},
					{
						title: 'Nouvelles Augmentées',
						author: 'Guillaume DARBONNE',
						tag: 'Science-fiction',
						status: 'Bientôt'
					},
					{ title: 'Le vert', author: 'Céline VASSEUR', tag: 'Art et nature', status: 'Bientôt' }
				],
				note: 'Service presse, librairies et droits étrangers sur demande.',
				ctaLabel: 'Aller au contact',
				targetSlug: 'contact'
			}
		]
	},
	{
		id: 4,
		slug: 'tarifs',
		title: 'Tarifs',
		navLabel: 'Tarifs',
		navNote: 'Estimation personnalisée',
		seoTitle: 'Tarifs | À fleur de lignes',
		seoDescription: defaultSiteSettings.siteDescription,
		sortOrder: 3,
		kind: 'pricing',
		showInNav: true,
		isSystem: false,
		blocks: [
			{
				id: 'pricing-configurator',
				type: 'pricingConfigurator',
				eyebrow: 'Tarifs',
				title: 'Configurateur de prix',
				lead: 'Sélectionnez les prestations dont vous avez besoin. Le calcul donne une estimation personnalisée, sans engagement.'
			}
		]
	},
	{
		id: 5,
		slug: 'soumission',
		title: 'Dépôt de projet',
		navLabel: 'Dépôt de projet',
		navNote: 'Manuscrit ou projet éditorial',
		seoTitle: 'Dépôt de projet | À fleur de lignes',
		seoDescription: defaultSiteSettings.siteDescription,
		sortOrder: 4,
		kind: 'standard',
		showInNav: true,
		isSystem: false,
		blocks: [
			{
				id: 'manuscript-list',
				type: 'list',
				eyebrow: 'Dossier',
				title: 'Préparer un dossier clair.',
				items: [
					'Un synopsis d’une page',
					'Trois chapitres ou trente pages',
					'Une note d’intention',
					'Coordonnées et bibliographie courte'
				],
				intro:
					'Les textes sont lus par sessions afin de répondre avec attention. Les projets de roman, poésie, récit, essai littéraire et livre illustré sont les bienvenus.'
			},
			{ id: 'manuscript-cta', type: 'cta', label: 'Demander une estimation', targetSlug: 'tarifs' }
		]
	},
	{
		id: 6,
		slug: 'contact',
		title: 'Contact',
		navLabel: 'Contact',
		navNote: 'Libraires, presse, droits',
		seoTitle: 'Contact | À fleur de lignes',
		seoDescription: defaultSiteSettings.siteDescription,
		sortOrder: 5,
		kind: 'contact',
		showInNav: true,
		isSystem: false,
		blocks: [
			{
				id: 'contact-links',
				type: 'contactLinks',
				eyebrow: 'Contact',
				title: 'Adresse éditoriale',
				links: [
					{
						label: 'Courriel',
						href: 'mailto:bonjour@afleurdelignes.fr',
						text: 'bonjour@afleurdelignes.fr'
					},
					{
						label: 'Manuscrits',
						href: 'mailto:manuscrits@afleurdelignes.fr',
						text: 'manuscrits@afleurdelignes.fr'
					},
					{
						label: 'Presse et libraires',
						href: 'mailto:presse@afleurdelignes.fr',
						text: 'presse@afleurdelignes.fr'
					}
				],
				ctaLabel: 'Déposer un projet',
				targetSlug: 'soumission'
			}
		]
	}
];

export const defaultBook: PublishedBook = {
	settings: defaultSiteSettings,
	pages: defaultPages
};
