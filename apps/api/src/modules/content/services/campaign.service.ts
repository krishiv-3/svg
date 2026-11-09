import { NotFoundError } from '../../../core/http/errors.js';
import { mapCampaignDetail, mapCampaignSummary } from '../mappers.js';
import type { Page } from '../pagination.js';
import type { CampaignRepository } from '../repositories/campaign.repository.js';
import type { CampaignDetailDto, CampaignSummaryDto } from '../dto.js';
import { parseListInput, requireValidSlug } from './input.js';

/**
 * Campaign services.
 *
 * Every read runs through the repository's `publicWhere()` predicate, so drafts,
 * scheduled and archived campaigns cannot be returned even if a caller asks for
 * their slug directly.
 */
export function createCampaignService(repository: CampaignRepository) {
  return {
    async list(input: unknown = {}): Promise<Page<CampaignSummaryDto>> {
      const { limit, cursor } = parseListInput(input);
      const page = await repository.listPublished({ limit, cursor });

      return { items: page.items.map(mapCampaignSummary), nextCursor: page.nextCursor };
    },

    async getBySlug(slug: string): Promise<CampaignDetailDto> {
      const validSlug = requireValidSlug(slug);
      const row = await repository.findPublishedBySlug(validSlug);

      if (row === null) {
        throw new NotFoundError('Campaign not found');
      }

      return mapCampaignDetail(row);
    },

    /** Featured campaign for the homepage; `null` when none is published. */
    async getFeatured(): Promise<CampaignDetailDto | null> {
      const row = await repository.findFeatured();
      return row === null ? null : mapCampaignDetail(row);
    },
  };
}

export type CampaignService = ReturnType<typeof createCampaignService>;
