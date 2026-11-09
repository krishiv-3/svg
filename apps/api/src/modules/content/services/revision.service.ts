import { z } from 'zod';

import { ConflictError, NotFoundError } from '../../../core/http/errors.js';
import type {
  RevisionEntityType,
  RevisionRepository,
  VersionState,
} from '../repositories/revision.repository.js';
import type { RevisionDetailDto, RevisionSummaryDto } from '../dto.js';

/**
 * Revision history and optimistic-concurrency checks.
 *
 * Snapshots are immutable — the database trigger refuses an update — so this
 * service only reads them. `assertVersion` is the piece Phase 7 writes will call
 * before an update: it turns a stale version into a 409 instead of a silent
 * overwrite, and reports the current version so the client can merge.
 */

const entityTypeSchema = z.enum([
  'PAGE',
  'ACTIVITY',
  'NEWS',
  'EVENT',
  'CAMPAIGN',
  'IMPACT',
  'TESTIMONIAL',
  'SETTING',
]);

const entityIdSchema = z.uuid();

function readSnapshot(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function toSummary(row: {
  id: string;
  entityType: string;
  entityId: string;
  version: number;
  status: string;
  createdById: string | null;
  createdAt: Date;
  publishedAt: Date | null;
}): RevisionSummaryDto {
  return {
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    version: row.version,
    status: row.status as RevisionSummaryDto['status'],
    createdBy: row.createdById,
    createdAt: row.createdAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() ?? null,
  };
}

function parseEntity(
  entityType: string,
  entityId: string,
): { type: RevisionEntityType; id: string } {
  const type = entityTypeSchema.safeParse(entityType);
  const id = entityIdSchema.safeParse(entityId);

  if (!type.success || !id.success) {
    throw new NotFoundError('Revision history not found');
  }

  return { type: type.data, id: id.data };
}

export function createRevisionService(repository: RevisionRepository) {
  return {
    async history(
      entityType: string,
      entityId: string,
      limit = 20,
    ): Promise<readonly RevisionSummaryDto[]> {
      const entity = parseEntity(entityType, entityId);
      const rows = await repository.listForEntity(entity.type, entity.id, limit);

      return rows.map(toSummary);
    },

    async published(entityType: string, entityId: string): Promise<RevisionDetailDto | null> {
      const entity = parseEntity(entityType, entityId);
      const row = await repository.findPublished(entity.type, entity.id);

      if (row === null) return null;

      return { ...toSummary(row), snapshot: readSnapshot(row.snapshot) };
    },

    async currentVersion(entityType: string, entityId: string): Promise<number> {
      const entity = parseEntity(entityType, entityId);
      return repository.currentVersion(entity.type, entity.id);
    },

    /**
     * Compare an expected version with the stored one.
     *
     * Phase 7 update handlers call this inside their transaction; the returned
     * state distinguishes "matches" from "someone else has written since".
     */
    async checkVersion(
      entityType: string,
      entityId: string,
      expected: number,
    ): Promise<VersionState> {
      const current = await this.currentVersion(entityType, entityId);

      return { current, matches: current === expected };
    },

    /** Throwing variant for write paths: a mismatch becomes a 409. */
    async assertVersion(entityType: string, entityId: string, expected: number): Promise<void> {
      const state = await this.checkVersion(entityType, entityId, expected);

      if (!state.matches) {
        throw new ConflictError(
          'VERSION_CONFLICT',
          `Version conflict: expected ${String(expected)}, current version is ${String(state.current)}`,
        );
      }
    },
  };
}

export type RevisionService = ReturnType<typeof createRevisionService>;
