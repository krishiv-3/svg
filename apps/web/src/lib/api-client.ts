import 'server-only';

import { livenessResponseSchema, type LivenessResponse } from '@gaushala/shared';

import { serverEnv } from './server-env';

/**
 * The only way the web application obtains data.
 *
 * Everything goes through the Express API — the web app has no database driver
 * and no knowledge of the schema. Responses are parsed with the shared Zod
 * contract so a breaking API change fails here rather than rendering garbage.
 *
 * **Status at the time of writing (Phase 5 complete):** retained intentionally
 * but not yet consumed. Public pages still read the demonstration adapters in
 * `src/content`. Phase 6 replaces those adapter bodies with calls through this
 * module, which is why the error type and timeout behaviour are already defined
 * here rather than being invented later.
 *
 * Phase 6 conventions for this file:
 *  - add one `getX()` per loader in `src/content/index.ts`;
 *  - keep `cache: 'no-store'` for authenticated/admin reads, and opt into
 *    `next: { revalidate, tags }` for public content when caching is introduced;
 *  - parse every response with a `@gaushala/shared` schema, never with a cast;
 *  - never import this module from a client component (it is `server-only`).
 */

const REQUEST_TIMEOUT_MS = 1_500;

/**
 * A non-2xx response, or a body that could not be parsed.
 *
 * Exported because Phase 6 needs to distinguish "not found" (render the 404
 * page) from "API unavailable" (render an error state) — catching a bare `Error`
 * would lose that distinction.
 */
export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

async function apiGet<T>(
  path: string,
  parse: (value: unknown) => T,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<T> {
  const response = await fetch(new URL(path, serverEnv.API_URL), {
    method: 'GET',
    headers: { accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new ApiRequestError(
      `API responded ${String(response.status)} for ${path}`,
      response.status,
    );
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    // A 2xx with an empty or malformed body is still a failure of this call.
    throw new ApiRequestError(`API returned an unreadable body for ${path}`, response.status);
  }

  return parse(payload);
}

export interface ApiStatus {
  reachable: boolean;
  version?: string;
  environment?: string;
}

/**
 * Liveness probe used by the foundation page.
 *
 * Returns a value instead of throwing: an unavailable API must never break
 * rendering of the page shell.
 */
export async function getApiStatus(): Promise<ApiStatus> {
  try {
    const payload: LivenessResponse = await apiGet('/health/live', (value) =>
      livenessResponseSchema.parse(value),
    );
    return {
      reachable: true,
      ...(payload.version === undefined ? {} : { version: payload.version }),
      ...(payload.environment === undefined ? {} : { environment: payload.environment }),
    };
  } catch {
    return { reachable: false };
  }
}
