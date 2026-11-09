import { collectionQuerySchema, listQuerySchema, slugSchema } from '@gaushala/shared';

import { NotFoundError } from '../../../core/http/errors.js';
import { decodeCursor, pageSize, type Cursor } from '../pagination.js';

/**
 * Input validation shared by the public services.
 *
 * Services validate their own inputs rather than trusting the route: sub-phase C
 * will hand these functions already-parsed query objects, but the guarantees
 * must not depend on that. A malformed slug is treated as "no such resource"
 * (404) instead of a validation error, because it cannot name anything that
 * exists and a 422 would say more than the caller needs to know.
 */

export interface ListInput {
  readonly limit: number;
  readonly cursor: Cursor | null;
}

export function parseListInput(input: unknown = {}): ListInput {
  const query = listQuerySchema.parse(input ?? {});
  return { limit: pageSize(query.limit), cursor: decodeCursor(query.cursor) };
}

export interface CollectionInput extends ListInput {
  readonly categorySlug: string | undefined;
}

export function parseCollectionInput(input: unknown = {}): CollectionInput {
  const query = collectionQuerySchema.parse(input ?? {});
  return {
    limit: pageSize(query.limit),
    cursor: decodeCursor(query.cursor),
    categorySlug: query.category,
  };
}

/** Validate a slug and return it, or throw the public "not found" error. */
export function requireValidSlug(slug: string): string {
  const parsed = slugSchema.safeParse(slug);

  if (!parsed.success) {
    throw new NotFoundError('Resource not found');
  }

  return parsed.data;
}
