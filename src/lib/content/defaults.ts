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
		title: 'Couverture',
		navLabel: 'Couverture',
		navNote: 'Accueil',
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
				title: 'Des textes à ouvrir comme des fleurs.',
				buttonLabel: 'Ouvrir le livre',
				targetSlug: 'sommaire'
			}
		]
	},
	{
		id: 2,
		slug: 'sommaire',
		title: 'Sommaire',
		navLabel: 'Sommaire',
		navNote: 'Carte du livre-site',
		seoTitle: 'Sommaire | À fleur de lignes',
		seoDescription: defaultSiteSettings.siteDescription,
		sortOrder: 1,
		kind: 'standard',
		showInNav: false,
		isSystem: true,
		blocks: [{ id: 'contents-hero', type: 'hero', title: 'Sommaire' }]
	},
	{
		id: 3,
		slug: 'a-propos',
		title: 'À propos',
		navLabel: 'À propos',
		navNote: 'Création et publication',
		seoTitle: 'À propos | À fleur de lignes',
		seoDescription: defaultSiteSettings.siteDescription,
		sortOrder: 2,
		kind: 'standard',
		showInNav: true,
		isSystem: false,
		blocks: [
			{
				id: 'about-1',
				type: 'paragraphs',
				eyebrow: 'À propos',
				title: 'Créer des livres avec exigence et attention.',
				paragraphs: [
					'A fleur de lignes est né d’une volonté simple : rendre la création et la publication d’un livre accessibles aux auteurs tout en conservant un niveau de qualité professionnel.',
					"Depuis plusieurs années, j'accompagne des projets éditoriaux à travers la création de couvertures, la mise en page, la préparation des fichiers pour l’impression et la publication. À ce jour, j’ai participé à la réalisation d’une cinquantaine d’ouvrages en collaboration avec leurs auteurs ainsi qu’avec une maison d’édition indépendante.",
					'Mon parcours m’a également permis de découvrir le livre sous un autre angle grâce à près de dix années d’expérience en librairie. Cette double approche me donne une vision globale de la chaîne du livre, de sa conception jusqu’à sa rencontre avec les lecteurs.'
				]
			},
			{ id: 'about-cta', type: 'cta', label: 'Lire la suite', targetSlug: 'a-propos-suite' }
		]
	},
	{
		id: 4,
		slug: 'a-propos-suite',
		title: 'À propos',
		navLabel: 'À propos, suite',
		navNote: 'Accompagnement éditorial',
		seoTitle: 'À propos | À fleur de lignes',
		seoDescription: defaultSiteSettings.siteDescription,
		sortOrder: 3,
		kind: 'standard',
		showInNav: false,
		isSystem: false,
		blocks: [
			{
				id: 'about-2',
				type: 'paragraphs',
				eyebrow: 'À propos',
				title: 'Un accompagnement éditorial à chaque étape.',
				paragraphs: [
					'Au fil des projets, j’ai constaté les difficultés rencontrées par de nombreux auteurs : manque de réponses des maisons d’édition, démarches techniques complexes, délais importants ou absence d’accompagnement personnalisé.',
					'C’est pour répondre à ces besoins qu’est né A fleur de lignes.',
					'J’accompagne aujourd’hui les auteurs et porteurs de projets à chaque étape de leur publication : mise en page, préparation des illustrations, création de couverture, contrôle des fichiers d’impression, création de livres numériques EPUB et publication sur les plateformes KDP et BoD.',
					'Chaque projet est unique et bénéficie d’un suivi attentif, avec une approche à la fois humaine, rigoureuse et artisanale.',
					'Parce qu’un livre ne se résume pas à un simple fichier, chaque projet mérite une attention particulière pour devenir un ouvrage dont son auteur peut être fier.'
				]
			},
			{
				id: 'about-catalogue-cta',
				type: 'cta',
				label: 'Feuilleter le catalogue',
				targetSlug: 'catalogue'
			}
		]
	},
	{
		id: 5,
		slug: 'catalogue',
		title: 'Catalogue',
		navLabel: 'Catalogue',
		navNote: 'Livres en vitrine',
		seoTitle: 'Catalogue | À fleur de lignes',
		seoDescription: defaultSiteSettings.siteDescription,
		sortOrder: 4,
		kind: 'standard',
		showInNav: true,
		isSystem: false,
		blocks: [
			{
				id: 'catalogue-cards',
				type: 'catalogueCards',
				eyebrow: 'Catalogue',
				title: 'Livres en préparation',
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
		id: 6,
		slug: 'auteurs',
		title: 'Auteurs',
		navLabel: 'Auteurs',
		navNote: 'Voix accompagnées',
		seoTitle: 'Auteurs | À fleur de lignes',
		seoDescription: defaultSiteSettings.siteDescription,
		sortOrder: 5,
		kind: 'standard',
		showInNav: true,
		isSystem: false,
		blocks: [
			{
				id: 'authors-copy',
				type: 'paragraphs',
				eyebrow: 'Auteurs',
				title: 'Accompagner une voix sans la lisser.',
				paragraphs: [
					'Le travail éditorial commence par une écoute lente: structure, rythme, ponctuation, silence, promesse du livre à venir.',
					'La maison privilégie les dialogues longs, les tirages raisonnés et les liens durables avec les libraires.'
				]
			},
			{
				id: 'authors-cta',
				type: 'cta',
				label: 'Soumettre un manuscrit',
				targetSlug: 'manuscrits'
			}
		]
	},
	{
		id: 7,
		slug: 'manuscrits',
		title: 'Manuscrits',
		navLabel: 'Manuscrits',
		navNote: 'Soumettre un texte',
		seoTitle: 'Manuscrits | À fleur de lignes',
		seoDescription: defaultSiteSettings.siteDescription,
		sortOrder: 6,
		kind: 'standard',
		showInNav: true,
		isSystem: false,
		blocks: [
			{
				id: 'manuscript-list',
				type: 'list',
				eyebrow: 'Manuscrits',
				title: 'Ce que nous lisons en premier.',
				items: [
					'Un synopsis d’une page',
					'Trois chapitres ou trente pages',
					'Une note d’intention',
					'Coordonnées et bibliographie courte'
				],
				intro:
					'Les envois rouvrent par sessions afin de lire chaque texte avec attention. Les projets de roman, poésie, récit et essai littéraire sont les bienvenus.'
			},
			{ id: 'manuscript-cta', type: 'cta', label: 'Estimer un projet', targetSlug: 'tarifs' }
		]
	},
	{
		id: 8,
		slug: 'tarifs',
		title: 'Tarifs',
		navLabel: 'Tarifs',
		navNote: 'Estimation personnalisée',
		seoTitle: 'Tarifs | À fleur de lignes',
		seoDescription: defaultSiteSettings.siteDescription,
		sortOrder: 7,
		kind: 'standard',
		showInNav: true,
		isSystem: false,
		blocks: [
			{
				id: 'pricing-configurator',
				type: 'pricingConfigurator',
				eyebrow: 'Tarifs',
				title: 'Configurateur auteur',
				lead: 'Sélectionnez les prestations dont vous avez besoin. Le calcul donne une estimation personnalisée, sans engagement.'
			}
		]
	},
	{
		id: 9,
		slug: 'contact',
		title: 'Contact',
		navLabel: 'Contact',
		navNote: 'Libraires, presse, droits',
		seoTitle: 'Contact | À fleur de lignes',
		seoDescription: defaultSiteSettings.siteDescription,
		sortOrder: 8,
		kind: 'standard',
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
				ctaLabel: 'Retour couverture',
				targetSlug: ''
			}
		]
	},
	{
		id: 10,
		slug: 'dos',
		title: 'Dos',
		navLabel: 'Dos',
		navNote: 'Quatrième de couverture',
		seoTitle: 'À fleur de lignes',
		seoDescription: defaultSiteSettings.siteDescription,
		sortOrder: 9,
		kind: 'back_cover',
		showInNav: false,
		isSystem: true,
		blocks: [
			{
				id: 'back-copy',
				type: 'paragraphs',
				paragraphs: [
					'À Fleur de Lignes imprime des livres pour celles et ceux qui lisent au bord des phrases.'
				]
			}
		]
	}
];

export const defaultBook: PublishedBook = {
	settings: defaultSiteSettings,
	pages: defaultPages
};
