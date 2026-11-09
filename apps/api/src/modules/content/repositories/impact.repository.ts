import type { Prisma, PrismaClient } from '../../../generated/prisma/client.js';

/**
 * Impact statistics.
 *
 * The public predicate is the truthfulness gate: only VERIFIED, visible,
 * non-deleted figures with a verifier are served. The database enforces the same
 * rule (impact_verified_requires_evidence), so this query cannot widen it.
 */

const where = {
  verificationStatus: 'VERIFIED',
  isVisible: true,
  deletedAt: null,
  verifiedAt: { not: null },
} satisfies Prisma.ImpactStatWhereInput;

const select = {
  id: true,
  label: true,
  value: true,
  unit: true,
  periodLabel: true,
  methodology: true,
  sourceNote: true,
} satisfies Prisma.ImpactStatSelect;

export type ImpactRow = Prisma.ImpactStatGetPayload<{ select: typeof select }>;

export function createImpactRepository(prisma: PrismaClient) {
  return {
    async listPublic(limit = 8): Promise<ImpactRow[]> {
      return prisma.impactStat.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
        take: limit,
        select,
      });
    },
  };
}

export type ImpactRepository = ReturnType<typeof createImpactRepository>;
