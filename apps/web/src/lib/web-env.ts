import { z } from 'zod';

/**
 * Pure web-environment parsing.
 *
 * Kept separate from `server-env.ts` so the rules can be unit tested: that
 * module imports `server-only`, which throws outside a React Server Component
 * context.
 *
 * Rules:
 *  - `NEXT_PUBLIC_SITE_URL` is **required in production** and must be an absolute
 *    https URL on a non-local host. A build or start without it fails loudly
 *    rather than shipping canonical links pointing at localhost.
 *  - Development and test fall back to `http://localhost:3000`, so no production
 *    domain is ever hardcoded.
 *  - `API_URL` keeps a localhost default: the web app only calls it server-side.
 */

/** Local-only fallback. Never used when `APP_ENV`/`NODE_ENV` is production. */
export const DEV_SITE_URL = 'http://localhost:3000';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);

const schema = z.object({
  /** Base URL of the Express API. Server-side only; never exposed to the browser. */
  API_URL: z.url().default('http://localhost:4000'),
  /** Canonical public origin, used for metadata and absolute URLs. */
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
  WEB_VERSION: z.string().min(1).default('0.0.0-dev'),
});

export interface WebEnv {
  API_URL: string;
  NEXT_PUBLIC_SITE_URL: string;
  WEB_VERSION: string;
}

export interface ParseWebEnvOptions {
  /** True when building or running a production deployment. */
  isProduction: boolean;
}

export class WebEnvValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(
      `Invalid web environment configuration:\n${issues.map((issue) => `  - ${issue}`).join('\n')}\n\n` +
        'Copy apps/web/.env.example to apps/web/.env.local for local development. ' +
        'Production must set NEXT_PUBLIC_SITE_URL. See docs/DEVELOPMENT.md.',
    );
    this.name = 'WebEnvValidationError';
    this.issues = issues;
  }
}

/** Parse and validate, throwing a single readable error listing every problem. */
export function parseWebEnv(
  source: Record<string, string | undefined>,
  options: ParseWebEnvOptions,
): WebEnv {
  const result = schema.safeParse(source);

  if (!result.success) {
    throw new WebEnvValidationError(
      result.error.issues.map((issue) => {
        const path = issue.path.join('.') || '(root)';
        return `${path}: ${issue.message}`;
      }),
    );
  }

  const { API_URL, NEXT_PUBLIC_SITE_URL, WEB_VERSION } = result.data;

  if (!options.isProduction) {
    return { API_URL, NEXT_PUBLIC_SITE_URL: NEXT_PUBLIC_SITE_URL ?? DEV_SITE_URL, WEB_VERSION };
  }

  const issues: string[] = [];

  if (NEXT_PUBLIC_SITE_URL === undefined) {
    issues.push(
      'NEXT_PUBLIC_SITE_URL: required in production (canonical URLs and metadata would otherwise point at localhost)',
    );
  } else {
    const parsed = new URL(NEXT_PUBLIC_SITE_URL);

    if (parsed.protocol !== 'https:') {
      issues.push('NEXT_PUBLIC_SITE_URL: production must use https://');
    }

    if (LOCAL_HOSTNAMES.has(parsed.hostname.toLowerCase())) {
      issues.push(
        `NEXT_PUBLIC_SITE_URL: must not point at a local host ("${parsed.hostname}") in production`,
      );
    }
  }

  if (issues.length > 0) {
    throw new WebEnvValidationError(issues);
  }

  // Narrowed above: production without a URL has already thrown.
  return {
    API_URL,
    NEXT_PUBLIC_SITE_URL: NEXT_PUBLIC_SITE_URL ?? DEV_SITE_URL,
    WEB_VERSION,
  };
}
