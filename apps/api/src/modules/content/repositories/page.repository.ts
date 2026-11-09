import type { Prisma, PrismaClient } from '../../../generated/prisma/client.js';
import { publicWhere } from '../visibility.js';

/**
 * Pages and their ordered sections.
 *
 * Sections are read in the same query as the page: a page without its blocks is
 * useless to the renderer, and a second round-trip would be a needless query on
 * a free-tier database.
 */

const pageSelect = {
  kind: true,
  slug: true,
  title: true,
  summary: true,
  body: true,
  seoTitle: true,
  seoDescription: true,
  canonicalUrl: true,
  noindex: true,
  updatedAt: true,
  sections: {
    where: { isVisible: true },
    orderBy: { sortOrder: 'asc' },
    select: { type: true, sortOrder: true, content: true },
  },
} satisfies Prisma.PageSelect;

export type PageRow = Prisma.PageGetPayload<{ select: typeof pageSelect }>;

export function createPageRepository(prisma: PrismaClient) {
  return {
    async findPublishedBySlug(slug: string, now: Date = new Date()): Promise<PageRow | null> {
      return prisma.page.findFirst({
        where: { ...publicWhere(now), slug } as Prisma.PageWhereInput,
        select: pageSelect,
      });
    },

    async findLiveHomepage(now: Date = new Date()): Promise<PageRow | null> {
      return prisma.page.findFirst({
        where: { ...publicWhere(now), kind: 'HOMEPAGE' } as Prisma.PageWhereInput,
        select: pageSelect,
      });
    },

    /** Any live homepage row, regardless of publishing state (bootstrap only). */
    async findAnyHomepage(): Promise<{ id: string } | null> {
      return prisma.page.findFirst({
        where: { kind: 'HOMEPAGE', deletedAt: null },
        select: { id: true },
      });
    },

    /**
     * Create the homepage shell.
     *
     * Deliberately a DRAFT with no sections: bootstrapping must never publish
     * content. The unique index on `kind` makes a concurrent second attempt fail,
     * which the service turns into a re-read.
     */
    async createDraftHomepage(id: string): Promise<{ id: string }> {
      return prisma.page.create({
        data: {
          id,
          kind: 'HOMEPAGE',
          slug: '',
          title: 'Homepage',
          template: 'HOMEPAGE',
          status: 'DRAFT',
        },
        select: { id: true },
      });
    },
  };
}

export type PageRepository = ReturnType<typeof createPageRepository>;
