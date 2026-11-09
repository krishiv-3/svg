/**
 * Design tokens — the single source of truth for the Warm Earth & Terracotta
 * identity defined in the project blueprint (§5).
 *
 * These values are consumed by:
 *  - `apps/web/src/app/globals.css` (Tailwind v4 `@theme`, verified by
 *    `scripts/check-tokens.mjs` so the two cannot drift);
 *  - non-CSS surfaces such as receipt PDFs (later phases).
 *
 * Colours are copied verbatim from the approved palette. `terracottaInk` is an
 * accessibility addition (decision D-14): the brand terracotta does not reach
 * 4.5:1 for body text on warm ivory, so small text uses the deeper variant.
 *
 * `statusColors` are functional UI colours for alerts and state indicators. They
 * are NOT brand colours: never use them decoratively, never in marketing copy.
 */

export const palette = {
  /** Main background; soft, welcoming page sections. */
  warmIvory: '#FFF8EF',
  /** Primary brand colour, key buttons and important links. */
  terracotta: '#B85C38',
  /**
   * Accessible text companion to `terracotta` (≈5.9:1 on warm ivory).
   * Use for links and small text; keep the brand terracotta for large
   * surfaces and button fills.
   */
  terracottaInk: '#9A4A2C',
  /** Secondary accent, highlights, icons and campaign emphasis. */
  burntOrange: '#D97732',
  /** Navigation, headings, footer and dark surfaces. */
  deepCocoa: '#4A2F24',
  /** Cards, subtle panels, dividers and warm section backgrounds. */
  sand: '#E9D7C3',
  /** Body text and high-contrast content. */
  charcoalBrown: '#2C211B',
  /** Small premium accents, badges and decorative details; use sparingly. */
  antiqueBrass: '#C69A52',
  /** Forms, cards and clean contrast. */
  white: '#FFFFFF',
} as const;

export type PaletteColor = keyof typeof palette;

/**
 * Functional status colours — semantic only, never decorative.
 * All meet WCAG AA (≥ 4.5:1) as text on warm ivory; see DESIGN_SYSTEM.md §2.
 */
export const statusColors = {
  success: '#3F6B4A',
  warning: '#8A5A16',
  danger: '#9B2F2A',
  info: '#4A2F24',
} as const;

export type StatusColor = keyof typeof statusColors;

/**
 * Semantic aliases. Components should consume these (through Tailwind utilities)
 * rather than raw palette names, so a future theme change stays a one-file edit.
 */
export const semanticColors = {
  background: palette.warmIvory,
  surface: palette.white,
  surfaceMuted: palette.sand,
  surfaceInverse: palette.deepCocoa,
  textPrimary: palette.charcoalBrown,
  textSecondary: palette.deepCocoa,
  textMuted: '#6B564B',
  textInverse: palette.warmIvory,
  link: palette.terracottaInk,
  linkHover: palette.deepCocoa,
  actionPrimary: palette.terracotta,
  actionPrimaryText: palette.white,
  actionSecondary: palette.burntOrange,
  accent: palette.antiqueBrass,
  border: palette.sand,
  borderStrong: '#D6BFA6',
  focusRing: palette.deepCocoa,
  success: statusColors.success,
  warning: statusColors.warning,
  danger: statusColors.danger,
} as const;

/* -------------------------------------------------------------------------- */
/* Typography                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * One readable sans-serif family, per blueprint §5 and ARCHITECTURE §14.3.
 * Inter is chosen for legibility at small sizes, true tabular numerals (admin
 * tables), a wide weight range for display hierarchy and an OFL licence.
 *
 * The font file is self-hosted (`apps/web/src/fonts/inter-latin-variable.woff2`,
 * latin subset, 48 KB) and loaded with `next/font/local`, so no build-time or
 * runtime request leaves the origin.
 *
 * Devanagari is declared in the stack for future Hindi content (ADR-013). A
 * self-hosted Noto Sans Devanagari subset ships with the Hindi launch; until
 * then the stack falls back to a locally installed copy.
 */
export const typography = {
  family: {
    sans: "'InterVariable', 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', 'Noto Sans Devanagari', 'Helvetica Neue', Arial, sans-serif",
    devanagari:
      "'Noto Sans Devanagari', 'InterVariable', 'Inter', ui-sans-serif, system-ui, sans-serif",
    mono: "ui-monospace, 'SFMono-Regular', 'Cascadia Mono', Consolas, 'Liberation Mono', monospace",
  },

  /**
   * Role-based scale. Sizes are fluid where it matters (display → section) and
   * fixed at text sizes, so body copy keeps a predictable measure.
   */
  scale: {
    display: {
      size: 'clamp(2.5rem, 1.9rem + 2.8vw, 4.25rem)',
      lineHeight: '1.05',
      letterSpacing: '-0.022em',
      weight: 600,
    },
    title: {
      size: 'clamp(2rem, 1.65rem + 1.6vw, 3rem)',
      lineHeight: '1.1',
      letterSpacing: '-0.017em',
      weight: 600,
    },
    heading: {
      size: 'clamp(1.5rem, 1.32rem + 0.85vw, 2rem)',
      lineHeight: '1.2',
      letterSpacing: '-0.012em',
      weight: 600,
    },
    subheading: {
      size: '1.25rem',
      lineHeight: '1.35',
      letterSpacing: '-0.006em',
      weight: 600,
    },
    lead: {
      size: 'clamp(1.0625rem, 1rem + 0.35vw, 1.25rem)',
      lineHeight: '1.65',
      letterSpacing: '0',
      weight: 400,
    },
    body: { size: '1rem', lineHeight: '1.65', letterSpacing: '0', weight: 400 },
    bodySmall: { size: '0.9375rem', lineHeight: '1.6', letterSpacing: '0', weight: 400 },
    label: { size: '0.875rem', lineHeight: '1.4', letterSpacing: '0.005em', weight: 500 },
    caption: { size: '0.8125rem', lineHeight: '1.45', letterSpacing: '0.005em', weight: 400 },
    overline: {
      size: '0.75rem',
      lineHeight: '1.4',
      letterSpacing: '0.14em',
      weight: 600,
    },
  },

  /** Weight utilities used across the kit. */
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },

  /** Comfortable reading measure for long-form content. */
  measure: { prose: '65ch', narrow: '52ch' },
} as const;

export type TypeRole = keyof typeof typography.scale;

/* -------------------------------------------------------------------------- */
/* Space, layout, shape                                                        */
/* -------------------------------------------------------------------------- */

/** 4 px base step, visual rhythm on an 8 px grid for sections. */
export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
} as const;

/** Vertical rhythm for page sections. */
export const sectionSpacing = {
  compact: { mobile: '3rem', desktop: '4rem' },
  default: { mobile: '4rem', desktop: '6rem' },
  spacious: { mobile: '5rem', desktop: '8rem' },
} as const;

export const containers = {
  narrow: '40rem',
  prose: '45rem',
  content: '75rem',
  wide: '90rem',
} as const;

/** Mobile-first breakpoints (min-width). 360 px is the supported minimum width. */
export const breakpoints = {
  xs: '30rem',
  sm: '40rem',
  md: '48rem',
  lg: '64rem',
  xl: '80rem',
  '2xl': '90rem',
} as const;

export const radii = {
  xs: '0.125rem',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  '3xl': '2rem',
  full: '9999px',
} as const;

/** Warm-tinted shadows derived from deep cocoa, never pure black. */
export const shadows = {
  soft: '0 1px 2px rgba(74, 47, 36, 0.06)',
  raised: '0 1px 3px rgba(74, 47, 36, 0.10), 0 1px 2px rgba(74, 47, 36, 0.06)',
  elevated: '0 4px 12px rgba(74, 47, 36, 0.08), 0 1px 3px rgba(74, 47, 36, 0.06)',
  overlay: '0 12px 32px rgba(74, 47, 36, 0.14), 0 2px 8px rgba(74, 47, 36, 0.08)',
  /** Floating glass surfaces: a wide, soft ambient shadow plus a tight contact shadow. */
  glass: '0 18px 40px -18px rgba(74, 47, 36, 0.30), 0 2px 10px rgba(74, 47, 36, 0.06)',
  /** Hover state for cards: lifts off the page without looking heavy. */
  lifted: '0 24px 48px -22px rgba(74, 47, 36, 0.34), 0 4px 12px rgba(74, 47, 36, 0.08)',
} as const;

/**
 * Glassmorphism tokens.
 *
 * A controlled system, not a blanket effect: translucent warm surfaces with a
 * fine light border, one backdrop blur step per layer, and a solid fallback for
 * browsers without `backdrop-filter`.
 */
export const glass = {
  /** Default glass panel (header pill, floating cards). */
  surface: 'rgba(255, 248, 239, 0.72)',
  /** Denser glass for content that must stay highly readable. */
  surfaceStrong: 'rgba(255, 248, 239, 0.88)',
  /** Glass over dark or photographic backgrounds. */
  surfaceDark: 'rgba(44, 33, 27, 0.55)',
  border: 'rgba(255, 255, 255, 0.55)',
  borderSoft: 'rgba(74, 47, 36, 0.10)',
  highlight: 'rgba(255, 255, 255, 0.65)',
  blur: '18px',
  blurStrong: '28px',
  saturate: '140%',
} as const;

/**
 * Ambient gradients.
 *
 * Warm light only — terracotta, burnt orange and brass diffused into the ivory
 * base. They are accents behind content and on primary actions, never a
 * full-page wash.
 */
export const gradients = {
  /** Broad warm bloom behind a hero. */
  heroBloom:
    'radial-gradient(120% 90% at 50% -10%, rgba(217, 119, 50, 0.18) 0%, rgba(255, 248, 239, 0) 62%)',
  /** Secondary glow, offset to one side for asymmetry. */
  heroGlow:
    'radial-gradient(58% 58% at 82% 18%, rgba(198, 154, 82, 0.20) 0%, rgba(255, 248, 239, 0) 70%)',
  /** Top sheen on cards, gives the surface a light source. */
  cardSheen: 'linear-gradient(180deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 248, 239, 0) 46%)',
  /** Icon tile fill. */
  iconTile: 'linear-gradient(140deg, rgba(184, 92, 56, 0.22) 0%, rgba(217, 119, 50, 0.12) 100%)',
  /** Primary action fill. */
  cta: 'linear-gradient(135deg, #B85C38 0%, #D97732 100%)',
  /** Inner surface of the footer panel. */
  footerPanel: 'linear-gradient(180deg, rgba(255, 248, 239, 1) 0%, rgba(233, 215, 195, 0.55) 100%)',
} as const;

/**
 * Layering convention. Never invent an arbitrary z-index; pick the layer.
 * skipLink > toast > modal > backdrop > sticky > dropdown > raised > base.
 */
export const zIndex = {
  base: 0,
  raised: 10,
  dropdown: 20,
  sticky: 30,
  backdrop: 40,
  modal: 50,
  toast: 60,
  skipLink: 70,
} as const;

export const motion = {
  duration: { instant: '0ms', fast: '150ms', base: '200ms', slow: '250ms', deliberate: '400ms' },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0.2, 1)',
    entrance: 'cubic-bezier(0, 0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
  },
} as const;

export const designTokens = {
  palette,
  statusColors,
  semanticColors,
  typography,
  spacing,
  sectionSpacing,
  containers,
  breakpoints,
  radii,
  shadows,
  glass,
  gradients,
  zIndex,
  motion,
} as const;
