/**
 * Content source selection.
 *
 * Pure and dependency-free so it can be unit tested: importing the loaders
 * would pull in `server-only`, which must not happen in a plain Node test.
 *
 * Production may only read the database. `CONTENT_SOURCE=demo` is accepted for
 * development and preview builds, and rejected otherwise — a deployment cannot
 * render fictional content, and no page silently falls back to it when the API
 * is unavailable.
 */
export type ContentSource = 'api' | 'demo';

export interface ContentSourceInput {
  readonly requested: string | undefined;
  readonly nodeEnv: string | undefined;
}

export function resolveContentSource({ requested, nodeEnv }: ContentSourceInput): ContentSource {
  if (requested !== 'demo') {
    return 'api';
  }

  if (nodeEnv === 'production') {
    throw new Error(
      'CONTENT_SOURCE=demo is not permitted in production: public pages must read the database.',
    );
  }

  return 'demo';
}
