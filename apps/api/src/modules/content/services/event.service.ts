import { z } from 'zod';

import { NotFoundError } from '../../../core/http/errors.js';
import { mapEvent } from '../mappers.js';
import type { Page } from '../pagination.js';
import type { EventRepository } from '../repositories/event.repository.js';
import type { EventDto } from '../dto.js';
import { parseListInput, requireValidSlug } from './input.js';

const eventListInputSchema = z.object({
  when: z.enum(['upcoming', 'past']).default('upcoming'),
});

/**
 * Event services.
 *
 * "Upcoming" and "past" are both public reads; neither bypasses the publishing
 * predicate.
 */
export function createEventService(repository: EventRepository) {
  return {
    async list(input: unknown = {}): Promise<Page<EventDto>> {
      const { limit, cursor } = parseListInput(input);
      const { when } = eventListInputSchema.parse(input ?? {});
      const page = await repository.listPublished({ limit, cursor, when });

      return { items: page.items.map(mapEvent), nextCursor: page.nextCursor };
    },

    async getBySlug(slug: string): Promise<EventDto> {
      const validSlug = requireValidSlug(slug);
      const row = await repository.findPublishedBySlug(validSlug);

      if (row === null) {
        throw new NotFoundError('Event not found');
      }

      return mapEvent(row);
    },
  };
}

export type EventService = ReturnType<typeof createEventService>;
