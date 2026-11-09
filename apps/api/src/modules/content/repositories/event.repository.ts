import type { Prisma, PrismaClient } from '../../../generated/prisma/client.js';
import { keysetFilter, toPage, type Cursor, type Page } from '../pagination.js';
import { publicWhere } from '../visibility.js';

/**
 * Events.
 *
 * "Upcoming" and "past" are two directions of the same scan, ordered by
 * `startAt`. Both still require the record to be published: an event that has
 * passed is not automatically public.
 */

const select = {
  id: true,
  slug: true,
  title: true,
  description: true,
  startAt: true,
  endAt: true,
  timezone: true,
  venueName: true,
  isOnline: true,
  eventStatus: true,
  registrationMode: true,
  registrationUrl: true,
  capacity: true,
  isFeatured: true,
  seoTitle: true,
  seoDescription: true,
  canonicalUrl: true,
  noindex: true,
  poster: {
    select: { id: true, altText: true, caption: true, credit: true, width: true, height: true },
  },
} satisfies Prisma.EventSelect;

export type EventRow = Prisma.EventGetPayload<{ select: typeof select }>;

export type EventWindow = 'upcoming' | 'past';

export function createEventRepository(prisma: PrismaClient) {
  return {
    async listPublished(params: {
      limit: number;
      cursor: Cursor | null;
      when: EventWindow;
      now?: Date;
    }): Promise<Page<EventRow>> {
      const now = params.now ?? new Date();
      const upcoming = params.when === 'upcoming';
      const direction = upcoming ? 'asc' : 'desc';

      const where = {
        ...publicWhere(now),
        startAt: upcoming ? { gte: now } : { lt: now },
        ...(params.cursor === null ? {} : keysetFilter('startAt', params.cursor, direction)),
      } as Prisma.EventWhereInput;

      const rows = await prisma.event.findMany({
        where,
        orderBy: [{ startAt: direction }, { id: direction }],
        take: params.limit + 1,
        select,
      });

      return toPage(rows, params.limit, (row) => ({ at: row.startAt, id: row.id }));
    },

    async findPublishedBySlug(slug: string, now: Date = new Date()): Promise<EventRow | null> {
      return prisma.event.findFirst({
        where: { ...publicWhere(now), slug } as Prisma.EventWhereInput,
        select,
      });
    },

    /** The next published event that has not started yet. */
    async findNextUpcoming(now: Date = new Date()): Promise<EventRow | null> {
      return prisma.event.findFirst({
        where: { ...publicWhere(now), startAt: { gte: now } } as Prisma.EventWhereInput,
        orderBy: [{ startAt: 'asc' }, { id: 'asc' }],
        select,
      });
    },
  };
}

export type EventRepository = ReturnType<typeof createEventRepository>;
