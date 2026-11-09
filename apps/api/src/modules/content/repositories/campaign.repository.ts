import type { Prisma, PrismaClient } from '../../../generated/prisma/client.js';
import { keysetFilter, toPage, type Cursor, type Page } from '../pagination.js';
import { publicWhere } from '../visibility.js';

/**
 * Campaign reads.
 *
 * There is no `raised` column: the schema stores an optional manual total and,
 * later, verified donations. `raisedMinor` is resolved by the service from the
 * one source that is allowed for the campaign's `progressSource`.
 */

const listSelect = {
  id: true,
  slug: true,
  name: true,
  purposeSummary: true,
  targetAmountMinor: true,
  manualRaisedMinor: true,
  progressSource: true,
  currency: true,
  startDate: true,
  endDate: true,
  acceptsDonations: true,
  isFeatured: true,
  publishedAt: true,
  cover: {
    select: { id: true, altText: true, caption: true, credit: true, width: true, height: true },
  },
} satisfies Prisma.CampaignSelect;

/**
 * Campaign updates carry no `deletedAt` column: they are hidden by status alone,
 * so the same publishing rule is applied explicitly here.
 */
function detailSelect(now: Date) {
  return {
    ...listSelect,
    story: true,
    seoTitle: true,
    seoDescription: true,
    canonicalUrl: true,
    noindex: true,
    updates: {
      where: { status: 'PUBLISHED' as const, publishedAt: { not: null, lte: now } },
      orderBy: [{ publishedAt: 'desc' as const }, { id: 'desc' as const }],
      select: {
        id: true,
        title: true,
        body: true,
        publishedAt: true,
        media: {
          select: {
            id: true,
            altText: true,
            caption: true,
            credit: true,
            width: true,
            height: true,
          },
        },
      },
    },
  } satisfies Prisma.CampaignSelect;
}

export type CampaignListRow = Prisma.CampaignGetPayload<{ select: typeof listSelect }>;
export type CampaignDetailRow = Prisma.CampaignGetPayload<{
  select: ReturnType<typeof detailSelect>;
}>;

export function createCampaignRepository(prisma: PrismaClient) {
  return {
    /** Published campaigns, newest first, keyset-paginated. */
    async listPublished(params: {
      limit: number;
      cursor: Cursor | null;
    }): Promise<Page<CampaignListRow>> {
      const where = {
        ...publicWhere(),
        ...(params.cursor === null ? {} : keysetFilter('publishedAt', params.cursor)),
      } as Prisma.CampaignWhereInput;

      const rows = await prisma.campaign.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
        take: params.limit + 1,
        select: listSelect,
      });

      return toPage(rows, params.limit, (row) => ({
        at: row.publishedAt ?? new Date(0),
        id: row.id,
      }));
    },

    /** The single featured campaign, if one is published. */
    async findFeatured(now: Date = new Date()): Promise<CampaignDetailRow | null> {
      return prisma.campaign.findFirst({
        where: { ...publicWhere(now), isFeatured: true } as Prisma.CampaignWhereInput,
        select: detailSelect(now),
      });
    },

    async findPublishedBySlug(
      slug: string,
      now: Date = new Date(),
    ): Promise<CampaignDetailRow | null> {
      return prisma.campaign.findFirst({
        where: { ...publicWhere(now), slug } as Prisma.CampaignWhereInput,
        select: detailSelect(now),
      });
    },
  };
}

export type CampaignRepository = ReturnType<typeof createCampaignRepository>;
