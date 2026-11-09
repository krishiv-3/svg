import { parseSectionBlock } from '@gaushala/shared';

import type { ActivityRow } from './repositories/activity.repository.js';
import type { CampaignDetailRow, CampaignListRow } from './repositories/campaign.repository.js';
import type { EventRow } from './repositories/event.repository.js';
import type { GalleryRow } from './repositories/gallery.repository.js';
import type { ImpactRow } from './repositories/impact.repository.js';
import type { NewsDetailRow, NewsListRow } from './repositories/news.repository.js';
import type { PageRow } from './repositories/page.repository.js';
import type { TestimonialRow } from './repositories/testimonial.repository.js';

import {
  readParagraphs,
  toIso,
  toMediaDto,
  toMinorNumber,
  toSeoDto,
  type ActivityDto,
  type CampaignDetailDto,
  type CampaignSummaryDto,
  type EventDto,
  type GalleryItemDto,
  type ImpactStatDto,
  type NewsDetailDto,
  type NewsSummaryDto,
  type PageDto,
  type PageSectionDto,
  type TestimonialDto,
} from './dto.js';

/**
 * Row → DTO mapping.
 *
 * Kept in one place so "what is public" is answerable by reading a single file:
 * every mapper selects the fields it needs and drops everything else.
 */

export function mapActivity(row: ActivityRow): ActivityDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.shortDescription,
    paragraphs: readParagraphs(row.body).paragraphs,
    category: row.category,
    media: toMediaDto(row.media),
    isFeatured: row.isFeatured,
    publishedAt: toIso(row.publishedAt),
    seo: toSeoDto(row),
  };
}

/**
 * The raised amount is resolved, never stored on the campaign row:
 *  - MANUAL: the audited manual total (the database requires a note for it);
 *  - VERIFIED_DONATIONS: `null` until the donations table exists (Phase 9).
 * Returning 0 would be a claim that nothing has been raised; `null` says the
 * figure is not reported yet.
 */
function raisedMinor(row: CampaignListRow): number | null {
  return row.progressSource === 'MANUAL' ? toMinorNumber(row.manualRaisedMinor) : null;
}

export function mapCampaignSummary(row: CampaignListRow): CampaignSummaryDto {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    purposeSummary: row.purposeSummary,
    targetAmountMinor: toMinorNumber(row.targetAmountMinor),
    raisedMinor: raisedMinor(row),
    currency: row.currency,
    startDate: toIso(row.startDate),
    endDate: toIso(row.endDate),
    acceptsDonations: row.acceptsDonations,
    isFeatured: row.isFeatured,
    cover: toMediaDto(row.cover),
    publishedAt: toIso(row.publishedAt),
  };
}

export function mapCampaignDetail(row: CampaignDetailRow): CampaignDetailDto {
  return {
    ...mapCampaignSummary(row),
    paragraphs: readParagraphs(row.story).paragraphs,
    updates: row.updates.map((update) => ({
      id: update.id,
      title: update.title,
      paragraphs: readParagraphs(update.body).paragraphs,
      publishedAt: toIso(update.publishedAt),
      media: toMediaDto(update.media),
    })),
    seo: toSeoDto(row),
  };
}

export function mapEvent(row: EventRow): EventDto {
  const description = readParagraphs(row.description);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: description.paragraphs[0] ?? row.title,
    paragraphs: description.paragraphs,
    startAt: toIso(row.startAt),
    endAt: toIso(row.endAt),
    timezone: row.timezone,
    venueName: row.venueName,
    isOnline: row.isOnline,
    poster: toMediaDto(row.poster),
    eventStatus: row.eventStatus,
    registrationMode: row.registrationMode,
    registrationUrl: row.registrationUrl,
    capacity: row.capacity,
    isFeatured: row.isFeatured,
    seo: toSeoDto(row),
  };
}

export function mapNewsSummary(row: NewsListRow): NewsSummaryDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category === null ? null : { name: row.category.name, slug: row.category.slug },
    publishedAt: toIso(row.publishedAt),
    updatedDisplayAt: toIso(row.updatedDisplayAt),
    cover: toMediaDto(row.cover),
  };
}

export function mapNewsDetail(row: NewsDetailRow): NewsDetailDto {
  return {
    ...mapNewsSummary(row),
    paragraphs: readParagraphs(row.body).paragraphs,
    attributionName: row.attributionName,
    readingMinutes: row.readingMinutes,
    seo: toSeoDto(row),
  };
}

export function mapGalleryItem(row: GalleryRow): GalleryItemDto {
  return {
    id: row.id,
    caption: row.caption,
    // The public predicate requires alt text, so this fallback is unreachable
    // in practice; it keeps the DTO's non-null promise honest.
    alt: row.altText ?? '',
    width: row.width,
    height: row.height,
    category: row.category === null ? null : { name: row.category.name, slug: row.category.slug },
    createdAt: toIso(row.createdAt),
  };
}

export function mapImpact(row: ImpactRow): ImpactStatDto {
  return {
    id: row.id,
    label: row.label,
    value: Number(row.value),
    unit: row.unit,
    periodLabel: row.periodLabel,
    methodology: row.methodology,
    sourceNote: row.sourceNote,
  };
}

export function mapTestimonial(row: TestimonialRow): TestimonialDto {
  return {
    id: row.id,
    quote: row.body,
    displayName: row.displayName,
    location: row.location,
  };
}

export interface ParsedSections {
  readonly sections: readonly PageSectionDto[];
  /** Sections dropped because their stored body failed validation. */
  readonly invalidCount: number;
}

/**
 * Validate stored section bodies.
 *
 * A malformed block is skipped rather than rendered or thrown on: one bad row
 * must not blank the homepage. The count is returned so the caller can log it.
 */
export function mapSections(rows: PageRow['sections']): ParsedSections {
  const sections: PageSectionDto[] = [];
  let invalidCount = 0;

  for (const row of rows) {
    const parsed = parseSectionBlock(row.type, row.content);

    if (!parsed.ok || parsed.block === undefined) {
      invalidCount += 1;
      continue;
    }

    sections.push({ type: parsed.block.type, sortOrder: row.sortOrder, block: parsed.block });
  }

  return { sections, invalidCount };
}

export function mapPage(row: PageRow): { page: PageDto; invalidSections: number } {
  const { sections, invalidCount } = mapSections(row.sections);

  return {
    page: {
      kind: row.kind,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      paragraphs: readParagraphs(row.body).paragraphs,
      seo: toSeoDto(row),
      updatedAt: toIso(row.updatedAt),
      sections,
    },
    invalidSections: invalidCount,
  };
}
