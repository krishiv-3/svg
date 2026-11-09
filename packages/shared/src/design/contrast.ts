/**
 * WCAG 2.2 contrast utilities.
 *
 * Used to keep the accessibility guarantees established in Phase 1 executable:
 * the palette values are fixed by the blueprint, so the contrast relationships
 * between them are testable facts rather than review opinions.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const HEX_PATTERN = /^#([0-9a-f]{6})$/i;

export function hexToRgb(hex: string): Rgb {
  const match = HEX_PATTERN.exec(hex.trim());
  if (!match || match[1] === undefined) {
    throw new Error(`Invalid hex colour: ${hex}`);
  }
  const value = Number.parseInt(match[1], 16);
  return {
    r: (value >> 16) & 0xff,
    g: (value >> 8) & 0xff,
    b: value & 0xff,
  };
}

/** WCAG 2.x relative luminance, 0 (black) – 1 (white). */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (value: number): number => {
    const srgb = value / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio between two colours, 1:1 – 21:1. */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG 2.2 AA for normal-size text. */
export const AA_NORMAL_TEXT = 4.5;

/** WCAG 2.2 AA for large text and non-text UI components. */
export const AA_LARGE_TEXT = 3;

export function meetsContrast(
  foreground: string,
  background: string,
  minimum: number = AA_NORMAL_TEXT,
): boolean {
  return contrastRatio(foreground, background) >= minimum;
}
