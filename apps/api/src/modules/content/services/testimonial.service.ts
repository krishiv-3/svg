import { mapTestimonial } from '../mappers.js';
import type { TestimonialRepository } from '../repositories/testimonial.repository.js';
import type { TestimonialDto } from '../dto.js';

/**
 * Public testimonials.
 *
 * Only APPROVED, visible, consent-backed rows are reachable; the repository
 * predicate and the database constraint both enforce it.
 */
export function createTestimonialService(repository: TestimonialRepository) {
  return {
    async listPublic(): Promise<readonly TestimonialDto[]> {
      const rows = await repository.listPublic();
      return rows.map(mapTestimonial);
    },
  };
}

export type TestimonialService = ReturnType<typeof createTestimonialService>;
