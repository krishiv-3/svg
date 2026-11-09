import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('skips empty values', () => {
    expect(cn('a', undefined, null, false, '', 'b')).toBe('a b');
  });

  it('returns an empty string when nothing is provided', () => {
    expect(cn()).toBe('');
    expect(cn(undefined, false, null, '')).toBe('');
  });

  it('keeps numeric values (spacing utilities are sometimes numeric)', () => {
    expect(cn('p', 4)).toBe('p 4');
  });
});
