import { describe, expect, it } from 'vitest';
import { normalizeSlug, parseBlocks, parsePageKind, validateBlocksForPageKind } from './validation';

describe('normalizeSlug', () => {
	it('normalizes accents and punctuation for URL paths', () => {
		expect.assertions(1);

		expect(normalizeSlug(' À propos, suite ! ')).toBe('a-propos-suite');
	});
});

describe('parsePageKind', () => {
	it('accepts typed page kinds and falls back to standard', () => {
		expect.assertions(3);

		expect(parsePageKind('pricing')).toBe('pricing');
		expect(parsePageKind('catalogue')).toBe('catalogue');
		expect(parsePageKind('unknown')).toBe('standard');
	});
});

describe('parseBlocks', () => {
	it('rejects unknown block types', () => {
		expect.assertions(1);

		expect(() => parseBlocks('[{"id":"x","type":"unknown"}]')).toThrow('Un bloc est invalide.');
	});
});

describe('validateBlocksForPageKind', () => {
	it('rejects blocks that do not belong to the selected page kind', () => {
		expect.assertions(1);

		expect(() =>
			validateBlocksForPageKind('pricing', [
				{ id: 'catalogue', type: 'catalogueCards', title: '', cards: [] }
			])
		).toThrow('Le type "Tarifs"');
	});
});
