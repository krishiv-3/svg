import { z } from 'zod';

import { NotFoundError } from '../../../core/http/errors.js';
import { mapActivity } from '../mappers.js';
import type { Page } from '../pagination.js';
import type { ActivityRepository } from '../repositories/activity.repository.js';
import type { ActivityDto } from '../dto.js';
import { parseListInput, requireValidSlug } from './input.js';

const activityListInputSchema = z.object({
  featuredOnly: z.coerce.boolean().optional(),
});

/** Activities: the "Our Work" collection and its detail read. */
export function createActivityService(repository: ActivityRepository) {
  return {
    async list(input: unknown = {}): Promise<Page<ActivityDto>> {
      const { limit, cursor } = parseListInput(input);
      const { featuredOnly } = activityListInputSchema.parse(input ?? {});
      const page = await repository.listPublished({
        limit,
        cursor,
        ...(featuredOnly === undefined ? {} : { featuredOnly }),
      });

      return { items: page.items.map(mapActivity), nextCursor: page.nextCursor };
    },

    async getBySlug(slug: string): Promise<ActivityDto> {
      const validSlug = requireValidSlug(slug);
      const row = await repository.findPublishedBySlug(validSlug);

      if (row === null) {
        throw new NotFoundError('Activity not found');
      }

      return mapActivity(row);
    },

    /** Bounded list used by the homepage `what_we_do` block. */
    async listForHomepage(limit: number): Promise<readonly ActivityDto[]> {
      const rows = await repository.listForHomepage(limit);
      return rows.map(mapActivity);
    },
  };
}

export type ActivityService = ReturnType<typeof createActivityService>;
