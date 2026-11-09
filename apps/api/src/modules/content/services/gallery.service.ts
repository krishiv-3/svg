import { mapGalleryItem } from '../mappers.js';
import type { Page } from '../pagination.js';
import type { GalleryRepository } from '../repositories/gallery.repository.js';
import type { GalleryAlbumDto, GalleryItemDto } from '../dto.js';
import { parseCollectionInput } from './input.js';

/**
 * Gallery services.
 *
 * Albums are derived from the categories that actually contain public images, so
 * an empty album never appears as a dead filter.
 */
export function createGalleryService(repository: GalleryRepository) {
  return {
    async list(
      input: unknown = {},
    ): Promise<{ items: Page<GalleryItemDto>; albums: readonly GalleryAlbumDto[] }> {
      const { limit, cursor, categorySlug } = parseCollectionInput(input);

      const page = await repository.listPublic({
        limit,
        cursor,
        ...(categorySlug === undefined ? {} : { categorySlug }),
      });

      const albums = await repository.listPublicAlbums();

      return {
        items: { items: page.items.map(mapGalleryItem), nextCursor: page.nextCursor },
        albums,
      };
    },

    async listAlbums(): Promise<readonly GalleryAlbumDto[]> {
      return repository.listPublicAlbums();
    },
  };
}

export type GalleryService = ReturnType<typeof createGalleryService>;
