import { describe, expect, it } from 'vitest';
import { defaultPricingConfig } from './defaults';
import { calculatePricing } from './engine';

describe('calculatePricing', () => {
	it('keeps the existing default estimate', () => {
		expect.assertions(3);

		const result = calculatePricing(defaultPricingConfig, defaultPricingConfig.defaults);

		expect(result.estimatedPages).toBe(120);
		expect(result.requiresQuote).toBe(false);
		expect(result.total).toBe(450);
	});

	it('marks art books and complex indexes as quote-only', () => {
		expect.assertions(2);

		expect(
			calculatePricing(defaultPricingConfig, {
				...defaultPricingConfig.defaults,
				bookCategory: 'art-book'
			}).requiresQuote
		).toBe(true);
		expect(
			calculatePricing(defaultPricingConfig, {
				...defaultPricingConfig.defaults,
				hasIndex: true,
				hasComplexIndex: true
			}).requiresQuote
		).toBe(true);
	});
});
