import { describe, expect, it } from 'vitest';

import {
  AA_LARGE_TEXT,
  AA_NORMAL_TEXT,
  contrastRatio,
  hexToRgb,
  meetsContrast,
} from './contrast.js';
import { palette } from './tokens.js';

describe('palette', () => {
  it('matches the approved blueprint values exactly', () => {
    expect(palette.warmIvory).toBe('#FFF8EF');
    expect(palette.terracotta).toBe('#B85C38');
    expect(palette.burntOrange).toBe('#D97732');
    expect(palette.deepCocoa).toBe('#4A2F24');
    expect(palette.sand).toBe('#E9D7C3');
    expect(palette.charcoalBrown).toBe('#2C211B');
    expect(palette.antiqueBrass).toBe('#C69A52');
    expect(palette.white).toBe('#FFFFFF');
  });

  it('exposes an accessible companion for terracotta body text', () => {
    expect(palette.terracottaInk).toBe('#9A4A2C');
  });
});

describe('contrast', () => {
  it('parses hex colours and rejects malformed input', () => {
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(() => hexToRgb('#FFF')).toThrow(/Invalid hex/);
    expect(() => hexToRgb('nope')).toThrow(/Invalid hex/);
  });

  it('computes the known extremes', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('keeps body text well above AA on the ivory background', () => {
    expect(contrastRatio(palette.charcoalBrown, palette.warmIvory)).toBeGreaterThan(13);
    expect(contrastRatio(palette.deepCocoa, palette.warmIvory)).toBeGreaterThan(10);
    expect(contrastRatio(palette.deepCocoa, palette.sand)).toBeGreaterThan(7);
    expect(contrastRatio(palette.warmIvory, palette.deepCocoa)).toBeGreaterThan(10);
  });

  it('documents that brand terracotta is not AA-safe for small text on ivory', () => {
    const ratio = contrastRatio(palette.terracotta, palette.warmIvory);
    // Recorded in ARCHITECTURE.md §14.2 — this is why terracottaInk exists.
    expect(ratio).toBeLessThan(AA_NORMAL_TEXT);
    expect(ratio).toBeGreaterThan(4);
  });

  it('provides an AA-safe terracotta for links and small text', () => {
    expect(meetsContrast(palette.terracottaInk, palette.warmIvory)).toBe(true);
    expect(contrastRatio(palette.terracottaInk, palette.warmIvory)).toBeGreaterThan(5);
  });

  it('allows white text on the primary action colour', () => {
    expect(meetsContrast(palette.white, palette.terracotta)).toBe(true);
  });

  it('restricts antique brass to decorative use', () => {
    expect(contrastRatio(palette.antiqueBrass, palette.warmIvory)).toBeLessThan(AA_LARGE_TEXT);
  });
});
