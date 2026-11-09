import { NotFoundError } from '../../../core/http/errors.js';
import { mapPage } from '../mappers.js';
import type { PageRepository } from '../repositories/page.repository.js';
import type { PageDto } from '../dto.js';
import { requireValidSlug } from './input.js';

/**
 * Static and policy pages.
 *
 * Sections are validated on the way out (`mapPage`), so a block whose stored
 * body no longer matches its schema is dropped rather than rendered.
 */
export function createPageService(repository: PageRepository) {
  return {
    async getBySlug(slug: string): Promise<PageDto> {
      const validSlug = requireValidSlug(slug);
      const row = await repository.findPublishedBySlug(validSlug);

      if (row === null) {
        throw new NotFoundError('Page not found');
      }

      return mapPage(row).page;
    },
  };
}

export type PageService = ReturnType<typeof createPageService>;
