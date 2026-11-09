import { NotFoundError } from '../../../core/http/errors.js';
import { mapNewsDetail, mapNewsSummary } from '../mappers.js';
import type { Page } from '../pagination.js';
import type { NewsRepository } from '../repositories/news.repository.js';
import type { NewsDetailDto, NewsSummaryDto } from '../dto.js';
import { parseCollectionInput, requireValidSlug } from './input.js';

const RELATED_LIMIT = 2;

/**
 * News services.
 *
 * The category filter is validated as a slug and resolved through the relation,
 * so an unknown category returns an empty page rather than a 500. Related
 * articles are fetched only for the detail read.
 */
export function createNewsService(repository: NewsRepository) {
  return {
    async list(input: unknown = {}): Promise<Page<NewsSummaryDto>> {
      const { limit, cursor, categorySlug } = parseCollectionInput(input);
      const page = await repository.listPublished({
        limit,
        cursor,
        ...(categorySlug === undefined ? {} : { categorySlug }),
      });

      // The repository already paginated and produced the cursor; re-deriving it
      // here would lose the "there is another page" signal.
      return { items: page.items.map(mapNewsSummary), nextCursor: page.nextCursor };
    },

    async getBySlug(
      slug: string,
    ): Promise<{ article: NewsDetailDto; related: readonly NewsSummaryDto[] }> {
      const validSlug = requireValidSlug(slug);
      const row = await repository.findPublishedBySlug(validSlug);

      if (row === null) {
        throw new NotFoundError('Article not found');
      }

      const related = await repository.findRelated({
        excludeSlug: validSlug,
        categoryId: row.categoryId,
        limit: RELATED_LIMIT,
      });

      return {
        article: mapNewsDetail(row),
        related: related.map(mapNewsSummary),
      };
    },

    async listCategories(): Promise<Array<{ name: string; slug: string }>> {
      return repository.listPublishedCategories();
    },
  };
}

export type NewsService = ReturnType<typeof createNewsService>;
