import type { Prisma, PrismaClient } from '../../../generated/prisma/client.js';

/**
 * Enquiries — read foundation only.
 *
 * No public write path exists in Phase 6: accepting a submission needs CSRF,
 * rate limiting and spam controls that arrive with the security phase. The
 * repository is intentionally read-only so a route cannot be added by accident
 * without adding those controls first.
 *
 * List queries never select `ipHash` or `userAgent`: they are incident-response
 * data, not part of any normal view.
 */

const listSelect = {
  id: true,
  reference: true,
  type: true,
  name: true,
  email: true,
  subject: true,
  status: true,
  createdAt: true,
  assignedToId: true,
} satisfies Prisma.EnquirySelect;

export type EnquiryListRow = Prisma.EnquiryGetPayload<{ select: typeof listSelect }>;

const detailSelect = {
  ...listSelect,
  phone: true,
  message: true,
  consentGivenAt: true,
  consentVersion: true,
  sourcePath: true,
  retentionDeleteAt: true,
  updatedAt: true,
} satisfies Prisma.EnquirySelect;

export type EnquiryDetailRow = Prisma.EnquiryGetPayload<{ select: typeof detailSelect }>;

export interface EnquiryListFilter {
  readonly status?: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'SPAM' | 'ARCHIVED' | undefined;
  readonly type?:
    | 'CONTACT'
    | 'VOLUNTEER'
    | 'VISIT'
    | 'EVENT_REGISTRATION'
    | 'DONATION_SUPPORT'
    | 'GENERAL'
    | undefined;
  readonly limit: number;
  readonly offset: number;
}

export function createEnquiryRepository(prisma: PrismaClient) {
  return {
    async list(filter: EnquiryListFilter): Promise<{ rows: EnquiryListRow[]; total: number }> {
      const where: Prisma.EnquiryWhereInput = {
        ...(filter.status === undefined ? {} : { status: filter.status }),
        ...(filter.type === undefined ? {} : { type: filter.type }),
      };

      const [rows, total] = await prisma.$transaction([
        prisma.enquiry.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: filter.limit,
          skip: filter.offset,
          select: listSelect,
        }),
        prisma.enquiry.count({ where }),
      ]);

      return { rows, total };
    },

    async findById(id: string): Promise<EnquiryDetailRow | null> {
      return prisma.enquiry.findUnique({ where: { id }, select: detailSelect });
    },

    async countByStatus(): Promise<Array<{ status: string; count: number }>> {
      const rows = await prisma.enquiry.groupBy({ by: ['status'], _count: { _all: true } });

      return rows.map((row) => ({ status: row.status, count: row._count._all }));
    },
  };
}

export type EnquiryRepository = ReturnType<typeof createEnquiryRepository>;
