import { describe, expect, it } from 'vitest';
import { normalizeSlug } from './validation';

describe('normalizeSlug', () => {
	it('normalizes accents and punctuation for URL paths', () => {
		expect.assertions(1);

		expect(normalizeSlug(' À propos, suite ! ')).toBe('a-propos-suite');
	});
});
