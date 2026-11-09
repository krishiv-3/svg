import { uuidv7 } from '@gaushala/shared';

import { mapPage } from '../mappers.js';
import type { PageRepository } from '../repositories/page.repository.js';
import type { ActivityService } from './activity.service.js';
import type { CampaignService } from './campaign.service.js';
import type { EventService } from './event.service.js';
import type { GalleryService } from './gallery.service.js';
import type { ImpactService } from './impact.service.js';
import type { NewsService } from './news.service.js';
import type { HomepageDto, HomepageSectionDto } from '../dto.js';

/**
 * Homepage assembly.
 *
 * The database guarantees **at most one** homepage (`pages_single_homepage`, a
 * partial unique index on `kind`), not "exactly one". Existence is therefore an
 * application guarantee, provided by `ensureHomepage()`:
 *
 *  - it is idempotent (returns the existing row if there is one);
 *  - it is race-safe (a concurrent creator loses the unique index and re-reads,
 *    instead of creating a second homepage or failing the request);
 *  - it creates a DRAFT with no sections, so bootstrapping never publishes.
 *
 * `get()` never creates anything: a read must not have side effects. If the row
 * is missing it returns `null`, and the caller decides whether that is a 404 or
 * a maintenance state.
 *
 * Section hydration happens per block, in sequence. The queries are deliberately
 * not wrapped in one transaction: seven statements would hold a connection for
 * the whole assembly on a free-tier database, and a "torn" homepage only means
 * one block lists a slightly older set — never that unpublished content leaks.
 */

export interface HomepageResult {
  readonly homepage: HomepageDto;
  /** Sections dropped because their stored JSON failed validation. */
  readonly invalidSections: number;
}

export interface HomepageDependencies {
  readonly pages: PageRepository;
  readonly activities: ActivityService;
  readonly campaigns: CampaignService;
  readonly events: EventService;
  readonly news: NewsService;
  readonly gallery: GalleryService;
  readonly impact: ImpactService;
}

export function createHomepageService(dependencies: HomepageDependencies) {
  const { pages, activities, campaigns, events, news, gallery, impact } = dependencies;

  async function hydrate(
    sections: readonly HomepageSectionDto[],
  ): Promise<readonly HomepageSectionDto[]> {
    const resolved: HomepageSectionDto[] = [];

    for (const section of sections) {
      switch (section.block.type) {
        case 'what_we_do': {
          const rows = await activities.listForHomepage(section.block.limit);
          resolved.push({ ...section, activities: rows });
          break;
        }

        case 'latest_news': {
          const page = await news.list({ limit: section.block.limit });
          resolved.push({ ...section, news: page.items });
          break;
        }

        case 'latest_events': {
          const page = await events.list({ limit: section.block.limit, when: 'upcoming' });
          resolved.push({ ...section, events: page.items });
          break;
        }

        case 'featured_campaign': {
          const campaign = await campaigns.getFeatured();
          resolved.push({ ...section, campaign });
          break;
        }

        case 'gallery_preview': {
          const result = await gallery.list({
            limit: section.block.limit,
            ...(section.block.categoryId === undefined
              ? {}
              : { categoryId: section.block.categoryId }),
          });
          resolved.push({ ...section, gallery: result.items.items });
          break;
        }

        case 'impact': {
          const stats = await impact.listPublic();
          resolved.push({ ...section, impact: stats.slice(0, section.block.limit) });
          break;
        }

        default:
          // Static blocks (hero, rich_text, support_cta, …) need no lookup.
          resolved.push(section);
      }
    }

    return resolved;
  }

  return {
    /** Read the published homepage. Returns `null` when it does not exist. */
    async get(): Promise<HomepageResult | null> {
      const row = await pages.findLiveHomepage();

      if (row === null) {
        return null;
      }

      const { page, invalidSections } = mapPage(row);
      const sections = await hydrate(page.sections);

      return {
        homepage: { page, sections, bootstrapped: false },
        invalidSections,
      };
    },

    /**
     * Guarantee that a homepage row exists. Safe to call from a seed, a
     * deployment step or a test setup; safe to call repeatedly and concurrently.
     */
    async ensureHomepage(): Promise<{ id: string; created: boolean }> {
      const existing = await pages.findAnyHomepage();

      if (existing !== null) {
        return { id: existing.id, created: false };
      }

      try {
        const created = await pages.createDraftHomepage(uuidv7());
        return { id: created.id, created: true };
      } catch (error) {
        // A concurrent creator won the unique index. Re-read rather than fail.
        const retry = await pages.findAnyHomepage();

        if (retry !== null) {
          return { id: retry.id, created: false };
        }

        throw error;
      }
    },
  };
}

export type HomepageService = ReturnType<typeof createHomepageService>;
