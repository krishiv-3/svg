/**
 * Public visibility — the single definition of "this record may be served".
 *
 * Every public query composes `publicWhere()` instead of writing its own
 * predicate, because five slightly different copies of this rule is exactly how
 * a draft leaks. The database does not decide visibility; it only guarantees
 * that the timestamps are coherent (see the content_constraints migration):
 *
 *  - PUBLISHED always has published_at;
 *  - SCHEDULED never has published_at, so a scheduled row cannot be visible even
 *    if someone forgets to filter on status.
 *
 * `unpublished_at` is audit metadata, not a visibility switch: unpublishing
 * moves the row to ARCHIVED or DRAFT, and `status` is what hides it. Treating a
 * stale `unpublished_at` as authoritative would silently hide content that was
 * republished later.
 */

export interface VisibilityCandidate {
  readonly status: string;
  readonly publishedAt: Date | null;
  readonly deletedAt: Date | null;
}

/**
 * Prisma filter for "publicly visible right now".
 *
 * The return type is structural so it can be spread into any content model's
 * `where` clause without a cast.
 */
export function publicWhere(now: Date = new Date()): {
  status: 'PUBLISHED';
  deletedAt: null;
  publishedAt: { not: null; lte: Date };
} {
  return {
    status: 'PUBLISHED',
    deletedAt: null,
    publishedAt: { not: null, lte: now },
  };
}

/** In-memory equivalent, for assertions after a write or in tests. */
export function isPubliclyVisible(row: VisibilityCandidate, now: Date = new Date()): boolean {
  return (
    row.status === 'PUBLISHED' &&
    row.deletedAt === null &&
    row.publishedAt !== null &&
    row.publishedAt.getTime() <= now.getTime()
  );
}
