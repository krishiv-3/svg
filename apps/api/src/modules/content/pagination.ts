import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@gaushala/shared';

import { ValidationError } from '../../core/http/errors.js';

/**
 * Keyset pagination.
 *
 * Public collections are ordered by a descending timestamp and then by `id`, and
 * the cursor carries both. Offset pagination would shift every later page
 * whenever an item is published, which is unacceptable for a news list.
 *
 * The cursor is opaque to clients: base64url of `{ at, id }`. A malformed cursor
 * is a 422 validation error, never a 500 and never a silently ignored value.
 */

export interface Cursor {
  readonly at: Date;
  readonly id: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(
    JSON.stringify({ at: cursor.at.toISOString(), id: cursor.id }),
    'utf8',
  ).toString('base64url');
}

export function decodeCursor(raw: string | undefined): Cursor | null {
  if (raw === undefined || raw.length === 0) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
  } catch {
    throw new ValidationError('Invalid pagination cursor');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new ValidationError('Invalid pagination cursor');
  }

  const { at, id } = parsed as { at?: unknown; id?: unknown };

  if (typeof at !== 'string' || typeof id !== 'string' || !UUID_PATTERN.test(id)) {
    throw new ValidationError('Invalid pagination cursor');
  }

  const date = new Date(at);

  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('Invalid pagination cursor');
  }

  return { at: date, id };
}

/** Normalise a requested page size against the shared limits. */
export function pageSize(requested?: number): number {
  if (requested === undefined) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(requested, 1), MAX_PAGE_SIZE);
}

/**
 * Prisma `OR` clause for "strictly after the cursor" in the scan direction.
 *
 * Rows are ordered by `(field, id)` in the same direction, so the next page
 * starts at rows whose timestamp is beyond the cursor, or whose timestamp
 * matches and whose id is beyond the cursor's id.
 */
export function keysetFilter(
  field: 'publishedAt' | 'createdAt' | 'startAt',
  cursor: Cursor,
  direction: 'asc' | 'desc' = 'desc',
): { OR: Array<Record<string, unknown>> } {
  const comparison = direction === 'asc' ? 'gt' : 'lt';

  return {
    OR: [
      { [field]: { [comparison]: cursor.at } },
      { [field]: cursor.at, id: { [comparison]: cursor.id } },
    ],
  };
}

export interface Page<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}

/** Build a page from `limit + 1` rows fetched from the database. */
export function toPage<T>(
  rows: readonly T[],
  limit: number,
  cursorOf: (row: T) => Cursor,
): Page<T> {
  if (rows.length <= limit) {
    return { items: rows, nextCursor: null };
  }

  const items = rows.slice(0, limit);
  const last = items[items.length - 1];

  return { items, nextCursor: last === undefined ? null : encodeCursor(cursorOf(last)) };
}
