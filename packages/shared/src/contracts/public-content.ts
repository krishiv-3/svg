import { z } from 'zod';

import { blockSchema, blockTypeSchema } from './blocks.js';

/**
 * Public content response contracts.
 *
 * The API serialises to these shapes and the web app parses against the same
 * schemas, so a change on one side fails fast on the other. They mirror the
 * service DTOs in `apps/api/src/modules/content/dto.ts`.
 *
 * Envelope: `{ data }` for a resource, `{ data, meta }` for a collection
 * (docs/API_DESIGN.md §4). Money is `{ amountMinor, currency }` (§4.4).
 */

export const moneySchema = z.object({
  amountMinor: z.number().int().nullable(),
  currency: z.string().length(3),
});
export type MoneyDto = z.infer<typeof moneySchema>;

export const mediaSchema = z.object({
  id: z.uuid(),
  alt: z.string().min(1),
  caption: z.string().nullable(),
  credit: z.string().nullable(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
});
export type MediaDto = z.infer<typeof mediaSchema>;

export const seoSchema = z.object({
  title: z.string().nullable(),
  description: z.string().nullable(),
  canonicalUrl: z.string().nullable(),
  noindex: z.boolean(),
});
export type SeoDto = z.infer<typeof seoSchema>;

const isoDate = z.string().nullable();

/* -------------------------------------------------------------------------- */
/* Pages                                                                      */
/* -------------------------------------------------------------------------- */

export const pageSectionSchema = z.object({
  type: blockTypeSchema,
  sortOrder: z.number().int(),
  block: blockSchema,
});
export type PageSectionDto = z.infer<typeof pageSectionSchema>;

export const pageSchema = z.object({
  kind: z.enum(['STANDARD', 'HOMEPAGE', 'POLICY']),
  slug: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  paragraphs: z.array(z.string()),
  seo: seoSchema,
  updatedAt: isoDate,
  sections: z.array(pageSectionSchema),
});
export type PageDto = z.infer<typeof pageSchema>;

/* -------------------------------------------------------------------------- */
/* Activities                                                                 */
/* -------------------------------------------------------------------------- */

export const activitySchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  paragraphs: z.array(z.string()),
  category: z.string().nullable(),
  media: mediaSchema.nullable(),
  isFeatured: z.boolean(),
  publishedAt: isoDate,
  seo: seoSchema,
});
export type ActivityDto = z.infer<typeof activitySchema>;

/* -------------------------------------------------------------------------- */
/* Campaigns                                                                  */
/* -------------------------------------------------------------------------- */

export const campaignSummarySchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  purposeSummary: z.string(),
  target: moneySchema,
  raised: moneySchema,
  startDate: isoDate,
  endDate: isoDate,
  acceptsDonations: z.boolean(),
  isFeatured: z.boolean(),
  cover: mediaSchema.nullable(),
  publishedAt: isoDate,
});
export type CampaignSummaryDto = z.infer<typeof campaignSummarySchema>;

export const campaignUpdateSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  paragraphs: z.array(z.string()),
  publishedAt: isoDate,
  media: mediaSchema.nullable(),
});
export type CampaignUpdateDto = z.infer<typeof campaignUpdateSchema>;

export const campaignDetailSchema = campaignSummarySchema.extend({
  paragraphs: z.array(z.string()),
  updates: z.array(campaignUpdateSchema),
  seo: seoSchema,
});
export type CampaignDetailDto = z.infer<typeof campaignDetailSchema>;

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

export const eventSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  paragraphs: z.array(z.string()),
  startAt: isoDate,
  endAt: isoDate,
  timezone: z.string(),
  venueName: z.string().nullable(),
  isOnline: z.boolean(),
  poster: mediaSchema.nullable(),
  eventStatus: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'POSTPONED']),
  registrationMode: z.enum(['NONE', 'CONTACT', 'EXTERNAL_URL', 'ENQUIRY_FORM']),
  registrationUrl: z.string().nullable(),
  capacity: z.number().int().nullable(),
  isFeatured: z.boolean(),
  seo: seoSchema,
});
export type EventDto = z.infer<typeof eventSchema>;

/* -------------------------------------------------------------------------- */
/* News                                                                       */
/* -------------------------------------------------------------------------- */

export const newsCategorySchema = z.object({ name: z.string(), slug: z.string() });
export type NewsCategoryDto = z.infer<typeof newsCategorySchema>;

export const newsSummarySchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  category: newsCategorySchema.nullable(),
  publishedAt: isoDate,
  updatedDisplayAt: isoDate,
  cover: mediaSchema.nullable(),
});
export type NewsSummaryDto = z.infer<typeof newsSummarySchema>;

export const newsDetailSchema = newsSummarySchema.extend({
  paragraphs: z.array(z.string()),
  attributionName: z.string().nullable(),
  readingMinutes: z.number().int().nullable(),
  seo: seoSchema,
});
export type NewsDetailDto = z.infer<typeof newsDetailSchema>;

/* -------------------------------------------------------------------------- */
/* Gallery, impact, testimonials                                              */
/* -------------------------------------------------------------------------- */

export const galleryItemSchema = z.object({
  id: z.uuid(),
  caption: z.string().nullable(),
  alt: z.string(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  category: newsCategorySchema.nullable(),
  createdAt: isoDate,
});
export type GalleryItemDto = z.infer<typeof galleryItemSchema>;

export const galleryAlbumSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  itemCount: z.number().int().nonnegative(),
});
export type GalleryAlbumDto = z.infer<typeof galleryAlbumSchema>;

export const impactStatSchema = z.object({
  id: z.uuid(),
  label: z.string(),
  value: z.number(),
  unit: z.string().nullable(),
  periodLabel: z.string().nullable(),
  methodology: z.string(),
  sourceNote: z.string().nullable(),
});
export type ImpactStatDto = z.infer<typeof impactStatSchema>;

export const testimonialSchema = z.object({
  id: z.uuid(),
  quote: z.string(),
  displayName: z.string(),
  location: z.string().nullable(),
});
export type TestimonialDto = z.infer<typeof testimonialSchema>;

/* -------------------------------------------------------------------------- */
/* Homepage                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A homepage section: the validated block plus whatever it references, already
 * hydrated by the API so the web app makes exactly one request for the homepage.
 */
export const homepageSectionSchema = z.object({
  type: blockTypeSchema,
  sortOrder: z.number().int(),
  block: blockSchema,
  activities: z.array(activitySchema).optional(),
  news: z.array(newsSummarySchema).optional(),
  events: z.array(eventSchema).optional(),
  campaign: campaignDetailSchema.nullable().optional(),
  gallery: z.array(galleryItemSchema).optional(),
  impact: z.array(impactStatSchema).optional(),
});
export type HomepageSectionDto = z.infer<typeof homepageSectionSchema>;

export const homepageSchema = z.object({
  page: pageSchema,
  sections: z.array(homepageSectionSchema),
});
export type HomepageDto = z.infer<typeof homepageSchema>;

/* -------------------------------------------------------------------------- */
/* Envelopes                                                                  */
/* -------------------------------------------------------------------------- */

export const paginationMetaSchema = z.object({
  limit: z.number().int().positive(),
  nextCursor: z.string().nullable(),
});
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

export function dataEnvelope<T extends z.ZodTypeAny>(schema: T) {
  return z.object({ data: schema });
}

export function collectionEnvelope<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    meta: z.object({ pagination: paginationMetaSchema }),
  });
}
