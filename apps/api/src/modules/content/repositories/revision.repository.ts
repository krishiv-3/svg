import type { Prisma, PrismaClient } from '../../../generated/prisma/client.js';

/**
 * Revisions and optimistic-concurrency helpers.
 *
 * Revisions are immutable snapshots: the database trigger refuses any change to
 * `snapshot`, so this repository never updates one. It only reads history and
 * answers "what version is live?".
 *
 * `assertVersion` is the building block for Phase 7 writes: an update supplies
 * the version it read, and a mismatch becomes a 409 rather than a silent
 * overwrite.
 */

const summarySelect = {
  id: true,
  entityType: true,
  entityId: true,
  version: true,
  status: true,
  createdById: true,
  createdAt: true,
  publishedAt: true,
} satisfies Prisma.RevisionSelect;

const detailSelect = {
  ...summarySelect,
  snapshot: true,
} satisfies Prisma.RevisionSelect;

export type RevisionSummaryRow = Prisma.RevisionGetPayload<{ select: typeof summarySelect }>;
export type RevisionDetailRow = Prisma.RevisionGetPayload<{ select: typeof detailSelect }>;

export type RevisionEntityType =
  'PAGE' | 'ACTIVITY' | 'NEWS' | 'EVENT' | 'CAMPAIGN' | 'IMPACT' | 'TESTIMONIAL' | 'SETTING';

export interface VersionState {
  /** Highest version on record, or 0 when the entity has never been versioned. */
  readonly current: number;
  readonly matches: boolean;
}

export function createRevisionRepository(prisma: PrismaClient) {
  return {
    async listForEntity(
      entityType: RevisionEntityType,
      entityId: string,
      limit = 20,
    ): Promise<RevisionSummaryRow[]> {
      return prisma.revision.findMany({
        where: { entityType, entityId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit,
        select: summarySelect,
      });
    },

    async findById(id: string): Promise<RevisionDetailRow | null> {
      return prisma.revision.findUnique({ where: { id }, select: detailSelect });
    },

    async findPublished(
      entityType: RevisionEntityType,
      entityId: string,
    ): Promise<RevisionDetailRow | null> {
      return prisma.revision.findFirst({
        where: { entityType, entityId, status: 'PUBLISHED' },
        select: detailSelect,
      });
    },

    /** Highest version recorded for an entity (0 when there are no revisions). */
    async currentVersion(entityType: RevisionEntityType, entityId: string): Promise<number> {
      const result = await prisma.revision.aggregate({
        where: { entityType, entityId },
        _max: { version: true },
      });

      return result._max.version ?? 0;
    },
  };
}

export type RevisionRepository = ReturnType<typeof createRevisionRepository>;
