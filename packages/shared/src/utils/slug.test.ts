import { describe, expect, it } from 'vitest';

import { SLUG_MAX_LENGTH, isReservedSlug, isValidSlug, slugify } from './slug.js';

describe('slugify', () => {
  it('normalises common title text', () => {
    expect(slugify('About the Gaushala')).toBe('about-the-gaushala');
    expect(slugify('  Winter   Fodder Drive  ')).toBe('winter-fodder-drive');
    expect(slugify('News & Updates')).toBe('news-updates');
  });

  it('folds diacritics to ASCII', () => {
    expect(slugify('Café Résumé')).toBe('cafe-resume');
  });

  it('collapses punctuation and repeated separators', () => {
    expect(slugify('What we do: care / shelter')).toBe('what-we-do-care-shelter');
    expect(slugify('---leading and trailing---')).toBe('leading-and-trailing');
  });

  it('never returns a trailing hyphen after truncation', () => {
    const slug = slugify('a'.repeat(200), 10);
    expect(slug).toHaveLength(10);
    expect(slug.endsWith('-')).toBe(false);
  });

  it('respects the maximum length', () => {
    expect(slugify('x'.repeat(400)).length).toBe(SLUG_MAX_LENGTH);
  });

  it('returns an empty string when nothing survives', () => {
    expect(slugify('!!!')).toBe('');
    expect(slugify('')).toBe('');
  });
});

describe('isValidSlug', () => {
  it('accepts generated slugs', () => {
    expect(isValidSlug('about')).toBe(true);
    expect(isValidSlug('winter-fodder-drive-2026')).toBe(true);
  });

  it('rejects malformed values', () => {
    expect(isValidSlug('')).toBe(false);
    expect(isValidSlug('About')).toBe(false);
    expect(isValidSlug('-about')).toBe(false);
    expect(isValidSlug('about-')).toBe(false);
    expect(isValidSlug('about_us')).toBe(false);
    expect(isValidSlug('about/us')).toBe(false);
    expect(isValidSlug('x'.repeat(SLUG_MAX_LENGTH + 1))).toBe(false);
  });
});

describe('reserved slugs', () => {
  it('protects application routes', () => {
    for (const slug of ['admin', 'api', 'donate', 'privacy-policy', 'our-work']) {
      expect(isReservedSlug(slug)).toBe(true);
    }
    expect(isReservedSlug('about-our-work')).toBe(false);
  });
});
