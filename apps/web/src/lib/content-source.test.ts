import { describe, expect, it } from 'vitest';

import { resolveContentSource } from './content-source';

/**
 * Production must never render demonstration content. This is the guard that
 * makes that true, and it is deliberately testable without importing the
 * loaders (which are `server-only`).
 */
describe('resolveContentSource', () => {
  it('defaults to the database', () => {
    expect(resolveContentSource({ requested: undefined, nodeEnv: 'development' })).toBe('api');
    expect(resolveContentSource({ requested: undefined, nodeEnv: 'production' })).toBe('api');
  });

  it('allows demo content outside production', () => {
    expect(resolveContentSource({ requested: 'demo', nodeEnv: 'development' })).toBe('demo');
    expect(resolveContentSource({ requested: 'demo', nodeEnv: 'test' })).toBe('demo');
  });

  it('refuses demo content in production', () => {
    expect(() => resolveContentSource({ requested: 'demo', nodeEnv: 'production' })).toThrow(
      /not permitted in production/,
    );
  });

  it('ignores an unknown value rather than guessing', () => {
    expect(resolveContentSource({ requested: 'preview', nodeEnv: 'development' })).toBe('api');
  });
});
