export type ProjectType = 'paper' | 'epub' | 'paper-epub';
export type BookCategory = 'fiction' | 'essay' | 'illustrated' | 'youth' | 'poetry' | 'art-book';
export type CoverOption = 'ready-pdf' | 'supplied-illustration' | 'full-creation';
export type PublicationOption = 'kdp' | 'bod' | 'kdp-bod' | 'none';
export type IsbnOption = 'provided' | 'afleurdelignes';
export type VolumeInput = 'pages' | 'signs';

export type PricingCondition =
	| 'always'
	| 'wantsCorrection'
	| 'hasFootnotes'
	| 'hasIndex'
	| 'hasComplexIndex'
	| 'bookCategory:art-book'
	| 'projectType:epub'
	| 'projectType:paper-epub'
	| 'projectType:epub-or-paper-epub'
	| 'paperEpubWithCustomCover'
	| 'complexIndex';

export type PricingBreakdownKey =
	| 'layout'
	| 'correction'
	| 'illustrations'
	| 'tables'
	| 'footnotes'
	| 'index'
	| 'cover'
	| 'epub'
	| 'publication'
	| 'isbn';

export type PricingSelectOption<T extends string = string> = {
	value: T;
	label: string;
	price?: number;
};

export type PricingRule =
	| {
			id: string;
			label: string;
			key: PricingBreakdownKey;
			type: 'per_estimated_page';
			amount: number;
			minimum?: number;
			condition?: PricingCondition;
	  }
	| {
			id: string;
			label: string;
			key: PricingBreakdownKey;
			type: 'per_quantity';
			amount: number;
			input: 'illustrationCount' | 'tableCount';
			condition?: PricingCondition;
	  }
	| {
			id: string;
			label: string;
			key: PricingBreakdownKey;
			type: 'flat_if';
			amount: number;
			condition: PricingCondition;
	  }
	| {
			id: string;
			label: string;
			key: PricingBreakdownKey;
			type: 'flat_option_price';
			input: 'coverOption' | 'publicationOption' | 'isbnOption';
			optionGroup: 'coverOptions' | 'publicationOptions' | 'isbnOptions';
	  }
	| {
			id: string;
			label: string;
			key: PricingBreakdownKey;
			type: 'range_by_pages_if';
			condition: PricingCondition;
			tiers: { upTo?: number; amount: number }[];
	  }
	| {
			id: string;
			label: string;
			type: 'quote_if';
			condition: PricingCondition;
	  };

export type PricingInput = {
	projectType: ProjectType;
	bookCategory: BookCategory;
	volumeInput: VolumeInput;
	pageCount: number;
	signCount: number;
	illustrationCount: number;
	wantsCorrection: boolean;
	coverOption: CoverOption;
	hasFootnotes: boolean;
	hasIndex: boolean;
	hasComplexIndex: boolean;
	hasSummary: boolean;
	tableCount: number;
	publicationOption: PublicationOption;
	isbnOption: IsbnOption;
};

export type PricingConfig = {
	signsPerPage: number;
	defaults: PricingInput;
	projectTypes: PricingSelectOption<ProjectType>[];
	bookCategories: PricingSelectOption<BookCategory>[];
	coverOptions: PricingSelectOption<CoverOption>[];
	publicationOptions: PricingSelectOption<PublicationOption>[];
	isbnOptions: PricingSelectOption<IsbnOption>[];
	rules: PricingRule[];
};

export type PricingResult = {
	estimatedPages: number;
	total: number;
	requiresQuote: boolean;
	breakdown: {
		key: PricingBreakdownKey;
		label: string;
		amount: number;
	}[];
};
