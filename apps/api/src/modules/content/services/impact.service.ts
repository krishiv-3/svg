import { mapImpact } from '../mappers.js';
import type { ImpactRepository } from '../repositories/impact.repository.js';
import type { ImpactStatDto } from '../dto.js';

/**
 * Public impact statistics.
 *
 * There is no "all figures" variant on purpose: an unverified figure has no
 * public representation at all, which is the blueprint's truthfulness rule.
 */
export function createImpactService(repository: ImpactRepository) {
  return {
    async listPublic(): Promise<readonly ImpactStatDto[]> {
      const rows = await repository.listPublic();
      return rows.map(mapImpact);
    },
  };
}

export type ImpactService = ReturnType<typeof createImpactService>;
