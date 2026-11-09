import type { Prisma, PrismaClient } from '../../../generated/prisma/client.js';

/**
 * Testimonials.
 *
 * A testimonial is public only when it is APPROVED, visible and not deleted. The
 * database additionally refuses APPROVED rows without consent evidence and an
 * approver, so consent cannot be skipped by the application.
 */

const where = {
  approvalStatus: 'APPROVED',
  isVisible: true,
  deletedAt: null,
} satisfies Prisma.TestimonialWhereInput;

const select = {
  id: true,
  body: true,
  displayName: true,
  location: true,
} satisfies Prisma.TestimonialSelect;

export type TestimonialRow = Prisma.TestimonialGetPayload<{ select: typeof select }>;

export function createTestimonialRepository(prisma: PrismaClient) {
  return {
    async listPublic(limit = 6): Promise<TestimonialRow[]> {
      return prisma.testimonial.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
        take: limit,
        select,
      });
    },
  };
}

export type TestimonialRepository = ReturnType<typeof createTestimonialRepository>;
