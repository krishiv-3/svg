import type { Prisma, PrismaClient } from '../../../generated/prisma/client.js';
import { keysetFilter, toPage, type Cursor, type Page } from '../pagination.js';
import { publicWhere } from '../visibility.js';

/**
 * News posts and categories.
 *
 * Listing suppresses the full body (it is large and never shown in a card) and
 * the detail query fetches it only for a single article.
 */

const mediaSelect = {
  id: true,
  altText: true,
  caption: true,
  credit: true,
  width: true,
  height: true,
} as const;

const listSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  publishedAt: true,
  updatedDisplayAt: true,
  category: { select: { name: true, slug: true } },
  cover: { select: mediaSelect },
} satisfies Prisma.NewsPostSelect;

const detailSelect = {
  ...listSelect,
  body: true,
  attributionName: true,
  readingMinutes: true,
  seoTitle: true,
  seoDescription: true,
  canonicalUrl: true,
  noindex: true,
  categoryId: true,
} satisfies Prisma.NewsPostSelect;

export type NewsListRow = Prisma.NewsPostGetPayload<{ select: typeof listSelect }>;
export type NewsDetailRow = Prisma.NewsPostGetPayload<{ select: typeof detailSelect }>;

export function createNewsRepository(prisma: PrismaClient) {
  return {
    async listPublished(params: {
      limit: number;
      cursor: Cursor | null;
      categorySlug?: string | undefined;
      now?: Date;
    }): Promise<Page<NewsListRow>> {
      const now = params.now ?? new Date();

      const where = {
        ...publicWhere(now),
        ...(params.categorySlug === undefined ? {} : { category: { slug: params.categorySlug } }),
        ...(params.cursor === null ? {} : keysetFilter('publishedAt', params.cursor)),
      } as Prisma.NewsPostWhereInput;

      const rows = await prisma.newsPost.findMany({
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

    async findPublishedBySlug(slug: string, now: Date = new Date()): Promise<NewsDetailRow | null> {
      return prisma.newsPost.findFirst({
        where: { ...publicWhere(now), slug } as Prisma.NewsPostWhereInput,
        select: detailSelect,
      });
    },

    /** Related reading: same category first, newest first, excluding the article. */
    async findRelated(params: {
      excludeSlug: string;
      categoryId: string | null;
      limit: number;
      now?: Date;
    }): Promise<NewsListRow[]> {
      const now = params.now ?? new Date();

      const where = {
        ...publicWhere(now),
        slug: { not: params.excludeSlug },
        ...(params.categoryId === null ? {} : { categoryId: params.categoryId }),
      } as Prisma.NewsPostWhereInput;

      return prisma.newsPost.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
        take: params.limit,
        select: listSelect,
      });
    },

    /** Categories that actually have published articles, so filters never dead-end. */
    async listPublishedCategories(
      now: Date = new Date(),
    ): Promise<Array<{ name: string; slug: string }>> {
      const rows = await prisma.newsCategory.findMany({
        where: { posts: { some: publicWhere(now) as Prisma.NewsPostWhereInput } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: { name: true, slug: true },
      });

      return rows;
    },
  };
}

export type NewsRepository = ReturnType<typeof createNewsRepository>;
