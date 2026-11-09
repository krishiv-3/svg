/**
 * Slug utilities.
 *
 * The SEO plan (docs/SEO_PLAN.md §3) fixes the URL contract: lowercase ASCII,
 * digits and hyphens only, no leading/trailing hyphen, 160 characters maximum.
 * Both the API (validation) and the admin UI (suggestions) use this module so
 * the rule exists once.
 */

export const SLUG_MAX_LENGTH = 160;

const VALID_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Convert arbitrary text into a URL-safe slug.
 *
 * Diacritics are folded to their base letters (Devanagari has no ASCII
 * fallback and is therefore removed; a Hindi launch would need a transliteration
 * step, recorded as a deferred decision in ADR-013).
 */
export function slugify(input: string, maxLength: number = SLUG_MAX_LENGTH): string {
  const folded = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const slug = folded
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug.slice(0, maxLength).replace(/^-+|-+$/g, '');
}

/** True when `value` is already a valid slug. */
export function isValidSlug(value: string, maxLength: number = SLUG_MAX_LENGTH): boolean {
  return value.length > 0 && value.length <= maxLength && VALID_SLUG.test(value);
}

/**
 * Slugs that must never be used for a content page because they collide with
 * application routes (docs/SEO_PLAN.md §3, docs/ARCHITECTURE.md §8.1).
 */
export const RESERVED_SLUGS: readonly string[] = [
  'admin',
  'api',
  'preview',
  'donate',
  'donation',
  'search',
  'sitemap',
  'robots',
  'news',
  'events',
  'campaigns',
  'our-work',
  'about',
  'gaushala',
  'impact',
  'gallery',
  'volunteer',
  'contact',
  'transparency',
  'privacy-policy',
  'terms',
  'refund-policy',
];

export function isReservedSlug(value: string): boolean {
  return RESERVED_SLUGS.includes(value);
}
