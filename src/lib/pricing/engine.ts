import type {
	PricingCondition,
	PricingConfig,
	PricingInput,
	PricingResult,
	PricingRule
} from './types';

export function calculatePricing(config: PricingConfig, input: PricingInput): PricingResult {
	const estimatedPages = Math.max(
		0,
		Math.ceil(
			input.volumeInput === 'signs' ? input.signCount / config.signsPerPage : input.pageCount
		)
	);
	const totals = new Map<
		PricingResult['breakdown'][number]['key'],
		{ label: string; amount: number }
	>();
	let requiresQuote = false;

	for (const rule of config.rules) {
		const condition = 'condition' in rule ? (rule.condition ?? 'always') : 'always';
		if (!matchesCondition(condition, input)) continue;

		if (rule.type === 'quote_if') {
			requiresQuote = true;
			continue;
		}

		const amount = priceForRule(rule, config, input, estimatedPages);
		const existing = totals.get(rule.key);

		totals.set(rule.key, {
			label: existing?.label ?? rule.label,
			amount: (existing?.amount ?? 0) + amount
		});
	}

	const breakdown = Array.from(totals.entries()).map(([key, value]) => ({
		key,
		label: value.label,
		amount: value.amount
	}));

	return {
		estimatedPages,
		total: breakdown.reduce((sum, item) => sum + item.amount, 0),
		requiresQuote,
		breakdown
	};
}

function priceForRule(
	rule: Exclude<PricingRule, { type: 'quote_if' }>,
	config: PricingConfig,
	input: PricingInput,
	estimatedPages: number
) {
	if (rule.type === 'per_estimated_page') {
		return Math.max(rule.minimum ?? 0, estimatedPages * rule.amount);
	}

	if (rule.type === 'per_quantity') {
		return Math.max(0, Number(input[rule.input]) || 0) * rule.amount;
	}

	if (rule.type === 'flat_if') {
		return rule.amount;
	}

	if (rule.type === 'flat_option_price') {
		const options = config[rule.optionGroup];
		const value = input[rule.input];
		return options.find((option) => option.value === value)?.price ?? 0;
	}

	const sortedTiers = [...rule.tiers].sort(
		(a, b) => (a.upTo ?? Number.MAX_SAFE_INTEGER) - (b.upTo ?? Number.MAX_SAFE_INTEGER)
	);
	return (
		sortedTiers.find((tier) => tier.upTo === undefined || estimatedPages <= tier.upTo)?.amount ?? 0
	);
}

export function matchesCondition(condition: PricingCondition, input: PricingInput) {
	switch (condition) {
		case 'always':
			return true;
		case 'wantsCorrection':
			return input.wantsCorrection;
		case 'hasFootnotes':
			return input.hasFootnotes;
		case 'hasIndex':
			return input.hasIndex;
		case 'hasComplexIndex':
			return input.hasComplexIndex;
		case 'bookCategory:art-book':
			return input.bookCategory === 'art-book';
		case 'projectType:epub':
			return input.projectType === 'epub';
		case 'projectType:paper-epub':
			return input.projectType === 'paper-epub';
		case 'projectType:epub-or-paper-epub':
			return input.projectType === 'epub' || input.projectType === 'paper-epub';
		case 'paperEpubWithCustomCover':
			return input.projectType === 'paper-epub' && input.coverOption !== 'ready-pdf';
		case 'complexIndex':
			return input.hasIndex && input.hasComplexIndex;
		default:
			return false;
	}
}
