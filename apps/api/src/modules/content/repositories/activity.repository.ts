import type { Prisma, PrismaClient } from '../../../generated/prisma/client.js';
import { keysetFilter, toPage, type Cursor, type Page } from '../pagination.js';
import { publicWhere } from '../visibility.js';

/**
 * Activities ("Our Work").
 *
 * The homepage preview asks for a few; the work page asks for all of them.
 */

const select = {
  id: true,
  slug: true,
  title: true,
  shortDescription: true,
  body: true,
  category: true,
  isFeatured: true,
  publishedAt: true,
  seoTitle: true,
  seoDescription: true,
  canonicalUrl: true,
  noindex: true,
  media: {
    select: { id: true, altText: true, caption: true, credit: true, width: true, height: true },
  },
} satisfies Prisma.ActivitySelect;

export type ActivityRow = Prisma.ActivityGetPayload<{ select: typeof select }>;

export function createActivityRepository(prisma: PrismaClient) {
  return {
    async listPublished(params: {
      limit: number;
      cursor: Cursor | null;
      featuredOnly?: boolean;
      now?: Date;
    }): Promise<Page<ActivityRow>> {
      const now = params.now ?? new Date();

      const where = {
        ...publicWhere(now),
        ...(params.featuredOnly === true ? { isFeatured: true } : {}),
        ...(params.cursor === null ? {} : keysetFilter('publishedAt', params.cursor)),
      } as Prisma.ActivityWhereInput;

      const rows = await prisma.activity.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
        take: params.limit + 1,
        select,
      });

      return toPage(rows, params.limit, (row) => ({
        at: row.publishedAt ?? new Date(0),
        id: row.id,
      }));
    },

    /** Ordered set for the homepage block: featured first, then most recent. */
    async listForHomepage(limit: number, now: Date = new Date()): Promise<ActivityRow[]> {
      return prisma.activity.findMany({
        where: { ...publicWhere(now) } as Prisma.ActivityWhereInput,
        orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { id: 'desc' }],
        take: limit,
        select,
      });
    },

    async findPublishedBySlug(slug: string, now: Date = new Date()): Promise<ActivityRow | null> {
      return prisma.activity.findFirst({
        where: { ...publicWhere(now), slug } as Prisma.ActivityWhereInput,
        select,
      });
    },
  };
}

export type ActivityRepository = ReturnType<typeof createActivityRepository>;
