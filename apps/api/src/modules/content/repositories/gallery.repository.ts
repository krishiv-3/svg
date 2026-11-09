import type { Prisma, PrismaClient } from '../../../generated/prisma/client.js';
import { keysetFilter, toPage, type Cursor, type Page } from '../pagination.js';

/**
 * Gallery: public media rows and the albums (categories) that contain them.
 *
 * A gallery item is a `media` row — there is no separate gallery table. Public
 * means: a READY image, marked public, not soft-deleted, with alt text, inside a
 * category. Alt text is part of the predicate because an image without it cannot
 * be presented accessibly.
 */

const publicMediaWhere = {
  kind: 'IMAGE',
  status: 'READY',
  isPublic: true,
  deletedAt: null,
  altText: { not: null },
} satisfies Prisma.MediaWhereInput;

const select = {
  id: true,
  altText: true,
  caption: true,
  width: true,
  height: true,
  createdAt: true,
  category: { select: { name: true, slug: true } },
} satisfies Prisma.MediaSelect;

export type GalleryRow = Prisma.MediaGetPayload<{ select: typeof select }>;

export function createGalleryRepository(prisma: PrismaClient) {
  return {
    async listPublic(params: {
      limit: number;
      cursor: Cursor | null;
      categorySlug?: string | undefined;
      categoryId?: string | undefined;
    }): Promise<Page<GalleryRow>> {
      const where = {
        ...publicMediaWhere,
        ...(params.categorySlug === undefined ? {} : { category: { slug: params.categorySlug } }),
        ...(params.categoryId === undefined ? {} : { categoryId: params.categoryId }),
        ...(params.cursor === null ? {} : keysetFilter('createdAt', params.cursor)),
      } as Prisma.MediaWhereInput;

      const rows = await prisma.media.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: params.limit + 1,
        select,
      });

      return toPage(rows, params.limit, (row) => ({ at: row.createdAt, id: row.id }));
    },

    /** Albums that contain at least one public image. */
    async listPublicAlbums(): Promise<
      Array<{ name: string; slug: string; description: string | null; itemCount: number }>
    > {
      const rows = await prisma.mediaCategory.findMany({
        where: {
          kind: 'GALLERY',
          media: { some: publicMediaWhere },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: {
          name: true,
          slug: true,
          description: true,
          _count: { select: { media: { where: publicMediaWhere } } },
        },
      });

      return rows.map((row) => ({
        name: row.name,
        slug: row.slug,
        description: row.description,
        itemCount: row._count.media,
      }));
    },
  };
}

export type GalleryRepository = ReturnType<typeof createGalleryRepository>;
