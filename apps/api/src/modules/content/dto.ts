import { z } from 'zod';

import type { Block } from '@gaushala/shared';

/**
 * Public DTOs.
 *
 * Services return these shapes, never Prisma rows. Three reasons:
 *  - internal columns (storage keys, checksums, audit ids, soft-delete stamps)
 *    must never reach a client;
 *  - `BigInt` and `Decimal` do not survive JSON, so money is converted once here;
 *  - the web app can depend on a stable shape while the schema evolves.
 */

/* -------------------------------------------------------------------------- */
/* Shared pieces                                                              */
/* -------------------------------------------------------------------------- */

export interface MediaDto {
  readonly id: string;
  readonly alt: string;
  readonly caption: string | null;
  readonly credit: string | null;
  readonly width: number | null;
  readonly height: number | null;
}

export interface SeoDto {
  readonly title: string | null;
  readonly description: string | null;
  readonly canonicalUrl: string | null;
  readonly noindex: boolean;
}

/** Row shape every media select produces. */
export interface MediaRow {
  readonly id: string;
  readonly altText: string | null;
  readonly caption: string | null;
  readonly credit: string | null;
  readonly width: number | null;
  readonly height: number | null;
}

/** Row shape every SEO select produces. */
export interface SeoRow {
  readonly seoTitle: string | null;
  readonly seoDescription: string | null;
  readonly canonicalUrl: string | null;
  readonly noindex: boolean;
}

/**
 * Media without alt text is unusable to a screen reader, so it is treated as
 * "no image" rather than rendered with an empty description. This is the same
 * rule the design system enforces for `<ImageContainer>`.
 */
export function toMediaDto(row: MediaRow | null | undefined): MediaDto | null {
  if (row === null || row === undefined) return null;

  const alt = row.altText?.trim();

  if (alt === undefined || alt.length === 0) return null;

  return {
    id: row.id,
    alt,
    caption: row.caption,
    credit: row.credit,
    width: row.width,
    height: row.height,
  };
}

export function toSeoDto(row: SeoRow): SeoDto {
  return {
    title: row.seoTitle,
    description: row.seoDescription,
    canonicalUrl: row.canonicalUrl,
    noindex: row.noindex,
  };
}

/** `BIGINT` minor units → a JS number, refusing values JSON cannot hold exactly. */
export function toMinorNumber(value: bigint | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new RangeError('Monetary amount exceeds the safe integer range');
  }
  return Number(value);
}

export function toIso(value: Date | null | undefined): string | null {
  return value === null || value === undefined ? null : value.toISOString();
}

/* -------------------------------------------------------------------------- */
/* Text documents                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Long-form bodies are stored as `{ paragraphs: string[] }`, never HTML.
 * A malformed document yields no paragraphs and `ok: false`, so the caller can
 * log it without a single bad row taking the page down.
 */
export const textDocumentSchema = z.object({
  paragraphs: z.array(z.string().min(1).max(5000)).min(1).max(60),
});

export interface TextDocument {
  readonly paragraphs: readonly string[];
  readonly ok: boolean;
}

export function readParagraphs(value: unknown): TextDocument {
  const result = textDocumentSchema.safeParse(value);

  return result.success
    ? { paragraphs: result.data.paragraphs, ok: true }
    : { paragraphs: [], ok: false };
}

/* -------------------------------------------------------------------------- */
/* Pages                                                                      */
/* -------------------------------------------------------------------------- */

export interface PageSectionDto {
  readonly type: Block['type'];
  readonly sortOrder: number;
  readonly block: Block;
}

export interface PageDto {
  readonly kind: 'STANDARD' | 'HOMEPAGE' | 'POLICY';
  readonly slug: string;
  readonly title: string;
  readonly summary: string | null;
  readonly paragraphs: readonly string[];
  readonly seo: SeoDto;
  readonly updatedAt: string | null;
  readonly sections: readonly PageSectionDto[];
}

/* -------------------------------------------------------------------------- */
/* Activities                                                                 */
/* -------------------------------------------------------------------------- */

export interface ActivityDto {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly paragraphs: readonly string[];
  readonly category: string | null;
  readonly media: MediaDto | null;
  readonly isFeatured: boolean;
  readonly publishedAt: string | null;
  readonly seo: SeoDto;
}

/* -------------------------------------------------------------------------- */
/* Campaigns                                                                  */
/* -------------------------------------------------------------------------- */

export interface CampaignSummaryDto {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly purposeSummary: string;
  readonly targetAmountMinor: number | null;
  /** Derived, never stored: the database has no `raised` column by design. */
  readonly raisedMinor: number | null;
  readonly currency: string;
  readonly startDate: string | null;
  readonly endDate: string | null;
  readonly acceptsDonations: boolean;
  readonly isFeatured: boolean;
  readonly cover: MediaDto | null;
  readonly publishedAt: string | null;
}

export interface CampaignUpdateDto {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly publishedAt: string | null;
  readonly media: MediaDto | null;
}

export interface CampaignDetailDto extends CampaignSummaryDto {
  readonly paragraphs: readonly string[];
  readonly updates: readonly CampaignUpdateDto[];
  readonly seo: SeoDto;
}

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

export interface EventDto {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly paragraphs: readonly string[];
  readonly startAt: string | null;
  readonly endAt: string | null;
  readonly timezone: string;
  readonly venueName: string | null;
  readonly isOnline: boolean;
  readonly poster: MediaDto | null;
  readonly eventStatus: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';
  readonly registrationMode: 'NONE' | 'CONTACT' | 'EXTERNAL_URL' | 'ENQUIRY_FORM';
  readonly registrationUrl: string | null;
  readonly capacity: number | null;
  readonly isFeatured: boolean;
  readonly seo: SeoDto;
}

/* -------------------------------------------------------------------------- */
/* News                                                                       */
/* -------------------------------------------------------------------------- */

export interface NewsCategoryDto {
  readonly name: string;
  readonly slug: string;
}

export interface NewsSummaryDto {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly category: NewsCategoryDto | null;
  readonly publishedAt: string | null;
  readonly updatedDisplayAt: string | null;
  readonly cover: MediaDto | null;
}

export interface NewsDetailDto extends NewsSummaryDto {
  readonly paragraphs: readonly string[];
  readonly attributionName: string | null;
  readonly readingMinutes: number | null;
  readonly seo: SeoDto;
}

/* -------------------------------------------------------------------------- */
/* Gallery, impact, testimonials                                              */
/* -------------------------------------------------------------------------- */

export interface GalleryItemDto {
  readonly id: string;
  readonly caption: string | null;
  readonly alt: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly category: NewsCategoryDto | null;
  readonly createdAt: string | null;
}

export interface GalleryAlbumDto extends NewsCategoryDto {
  readonly description: string | null;
  readonly itemCount: number;
}

export interface ImpactStatDto {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly unit: string | null;
  readonly periodLabel: string | null;
  readonly methodology: string;
  readonly sourceNote: string | null;
}

export interface TestimonialDto {
  readonly id: string;
  readonly quote: string;
  readonly displayName: string;
  readonly location: string | null;
}

/* -------------------------------------------------------------------------- */
/* Homepage and revisions                                                     */
/* -------------------------------------------------------------------------- */

export interface HomepageSectionDto {
  readonly type: Block['type'];
  readonly sortOrder: number;
  readonly block: Block;
  /** Hydrated rows the block references, already DTO-mapped. */
  readonly activities?: readonly ActivityDto[];
  readonly news?: readonly NewsSummaryDto[];
  readonly events?: readonly EventDto[];
  readonly campaign?: CampaignDetailDto | null;
  readonly gallery?: readonly GalleryItemDto[];
  readonly impact?: readonly ImpactStatDto[];
}

export interface HomepageDto {
  readonly page: PageDto;
  readonly sections: readonly HomepageSectionDto[];
  /** True when the homepage row had to be created by the bootstrap. */
  readonly bootstrapped: boolean;
}

export interface RevisionSummaryDto {
  readonly id: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly version: number;
  readonly status: 'DRAFT' | 'PUBLISHED' | 'SUPERSEDED';
  readonly createdBy: string | null;
  readonly createdAt: string | null;
  readonly publishedAt: string | null;
}

export interface RevisionDetailDto extends RevisionSummaryDto {
  /** Validated snapshot; `null` when the stored snapshot is not an object. */
  readonly snapshot: Record<string, unknown> | null;
}
