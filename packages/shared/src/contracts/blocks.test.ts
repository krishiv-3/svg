import { describe, expect, it } from 'vitest';

import { BLOCK_TYPES, isKnownBlockType, parseSectionBlock, type Block } from './blocks.js';
import { listQuerySchema, MAX_PAGE_SIZE, slugSchema } from './content.js';

/**
 * Block validation is the gate between stored JSON and rendered UI: a section
 * whose body does not match its schema must be rejected, never coerced.
 */

const heroContent = {
  schemaVersion: 1,
  heading: 'Compassion begins with care',
  description: 'Every cow deserves kindness.',
  primaryCta: { label: 'Donate', href: '/donate' },
};

describe('parseSectionBlock', () => {
  it('accepts a valid block and returns it typed', () => {
    const result = parseSectionBlock('hero', heroContent);

    expect(result.ok).toBe(true);
    expect(result.block?.type).toBe('hero');
  });

  it('rejects an unknown block type', () => {
    const result = parseSectionBlock('not_a_block', heroContent);

    expect(result.ok).toBe(false);
    expect(result.issues?.length).toBeGreaterThan(0);
  });

  it('rejects a missing required field', () => {
    const result = parseSectionBlock('hero', { schemaVersion: 1, heading: 'Only a heading' });

    expect(result.ok).toBe(false);
  });

  it('rejects an unsupported schema version', () => {
    const result = parseSectionBlock('hero', { ...heroContent, schemaVersion: 2 });

    expect(result.ok).toBe(false);
  });

  it('rejects a non-object body', () => {
    expect(parseSectionBlock('hero', ['not', 'an', 'object']).ok).toBe(false);
    expect(parseSectionBlock('hero', 'a string').ok).toBe(false);
    expect(parseSectionBlock('hero', null).ok).toBe(false);
  });

  it('ignores a type stored inside the body and uses the column value', () => {
    // The database column is authoritative. A body claiming another type is
    // parsed as the column's type, and any field that type does not declare is
    // stripped rather than passed through to the renderer.
    const result = parseSectionBlock('impact', { ...heroContent, type: 'hero' });

    expect(result.ok).toBe(true);
    expect(result.block?.type).toBe('impact');
    expect(result.block).not.toHaveProperty('primaryCta');
  });

  it('applies per-type defaults', () => {
    const result = parseSectionBlock('latest_news', { schemaVersion: 1 });

    expect(result.ok).toBe(true);
    expect((result.block as Extract<Block, { type: 'latest_news' }>).limit).toBe(3);
  });

  it('bounds list limits', () => {
    expect(parseSectionBlock('latest_news', { schemaVersion: 1, limit: 99 }).ok).toBe(false);
    expect(parseSectionBlock('latest_news', { schemaVersion: 1, limit: 0 }).ok).toBe(false);
  });

  it('knows every block type it declares', () => {
    for (const type of BLOCK_TYPES) {
      expect(isKnownBlockType(type)).toBe(true);
    }

    expect(isKnownBlockType('unknown')).toBe(false);
  });
});

describe('list query validation', () => {
  it('applies defaults', () => {
    expect(listQuerySchema.parse({})).toEqual({ limit: 12 });
  });

  it('caps the page size', () => {
    expect(listQuerySchema.parse({ limit: String(MAX_PAGE_SIZE) }).limit).toBe(MAX_PAGE_SIZE);
    expect(() => listQuerySchema.parse({ limit: MAX_PAGE_SIZE + 1 })).toThrow();
    expect(() => listQuerySchema.parse({ limit: 0 })).toThrow();
  });

  it('rejects a non-numeric limit rather than coercing it to zero', () => {
    expect(() => listQuerySchema.parse({ limit: 'many' })).toThrow();
  });
});

describe('slug validation', () => {
  it('accepts a canonical slug', () => {
    expect(slugSchema.parse('winter-fodder-fund')).toBe('winter-fodder-fund');
  });

  it('rejects spaces, capitals and leading or trailing hyphens', () => {
    for (const slug of ['Winter', 'two words', '-leading', 'trailing-', 'double--hyphen', '']) {
      expect(() => slugSchema.parse(slug)).toThrow();
    }
  });
});
