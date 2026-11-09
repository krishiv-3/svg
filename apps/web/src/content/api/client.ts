import 'server-only';

import type { z } from 'zod';

import { serverEnv } from '@/lib/server-env';
import { ApiRequestError } from '@/lib/api-client';

/**
 * Public content client.
 *
 * Every page loader goes through here. Three guarantees:
 *  - responses are parsed with the shared Zod contract, so a breaking API change
 *    fails here rather than rendering `undefined`;
 *  - public reads are cached and tagged, so one revalidation can refresh them;
 *  - a missing resource (404) is distinguishable from an unavailable API, so the
 *    page can choose between "not found" and an error state — never demo data.
 */

const PUBLIC_REVALIDATE_SECONDS = 60;

export interface PublicFetchOptions {
  readonly revalidate?: number;
  /** Treat a 404 as `null` instead of throwing (used for optional page rows). */
  readonly optional?: boolean;
}

async function fetchJson(path: string, options: PublicFetchOptions): Promise<unknown | null> {
  const revalidate = options.revalidate ?? PUBLIC_REVALIDATE_SECONDS;

  const response = await fetch(new URL(path, serverEnv.API_URL), {
    method: 'GET',
    headers: { accept: 'application/json' },
    next: { revalidate },
    signal: AbortSignal.timeout(5_000),
  });

  if (response.status === 404 && options.optional === true) {
    return null;
  }

  if (!response.ok) {
    throw new ApiRequestError(
      `API responded ${String(response.status)} for ${path}`,
      response.status,
    );
  }

  return response.json();
}

/** Fetch a single resource and parse it with its shared schema. */
export async function getPublicResource<T>(
  path: string,
  schema: z.ZodType<T>,
  options: PublicFetchOptions = {},
): Promise<T> {
  const payload = await fetchJson(path, options);

  if (payload === null) {
    throw new ApiRequestError(`API returned no body for ${path}`, 404);
  }

  const envelope = payload as { data?: unknown };
  return schema.parse(envelope.data);
}

/**
 * Fetch a resource that may legitimately not exist yet (an unpublished page).
 *
 * Returns `null` for a 404 so the caller can fall back to its authored copy; any
 * other failure still throws, so an unavailable API is never mistaken for
 * "no content".
 */
export async function getOptionalPublicResource<T>(
  path: string,
  schema: z.ZodType<T>,
  options: PublicFetchOptions = {},
): Promise<T | null> {
  const payload = await fetchJson(path, { ...options, optional: true });

  if (payload === null) {
    return null;
  }

  const envelope = payload as { data?: unknown };
  return schema.parse(envelope.data);
}

/**
 * Fetch a collection. Returns the items and the pagination cursor so a page can
 * pass it straight back as `?cursor=`.
 */
export async function getPublicCollection<T>(
  path: string,
  itemSchema: z.ZodType<T>,
  options: PublicFetchOptions = {},
): Promise<{ items: readonly T[]; nextCursor: string | null }> {
  const payload = await fetchJson(path, options);

  if (payload === null) {
    return { items: [], nextCursor: null };
  }

  const envelope = payload as { data?: unknown; meta?: { pagination?: { nextCursor?: unknown } } };
  const items = itemSchema.array().parse(envelope.data ?? []);
  const nextCursor = envelope.meta?.pagination?.nextCursor;

  return { items, nextCursor: typeof nextCursor === 'string' ? nextCursor : null };
}

/** Build a query string, dropping undefined/empty values. */
export function publicQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    search.set(key, String(value));
  }

  const query = search.toString();
  return query.length === 0 ? '' : `?${query}`;
}
