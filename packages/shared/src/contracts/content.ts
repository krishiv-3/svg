import { z } from 'zod';

/**
 * Shared content contracts.
 *
 * These are the *inputs* every content endpoint accepts and the primitives the
 * public payloads are built from. Response DTO schemas are added in sub-phase C
 * when the endpoints exist; the building blocks below are shared now so the web
 * app and the API validate identically.
 */

/** A slug is a URL path segment: lowercase, hyphen-separated. */
export const slugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be lowercase letters, digits and single hyphens');

export const contentStatusSchema = z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']);
export type ContentStatus = z.infer<typeof contentStatusSchema>;

/** Pagination limits. The maximum is enforced server-side, never trusted. */
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 48;

/**
 * Cursor pagination.
 *
 * Public collections are ordered by a descending timestamp and then by id, so a
 * composite cursor is stable even when several rows share a timestamp (which
 * happens whenever content is published in a batch). Offset pagination was
 * rejected for these lists: publishing a new item would shift every later page.
 */
export const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  cursor: z.string().min(1).max(512).optional(),
});
export type ListQuery = z.infer<typeof listQuerySchema>;

/** Category filters offered by the public collections. */
export const categoryQuerySchema = z.object({
  category: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be a category slug')
    .optional(),
});
export type CategoryQuery = z.infer<typeof categoryQuerySchema>;

/**
 * Sort allow-lists.
 *
 * A request never names a database column: it names one of these values, which
 * the repository maps to a fixed `orderBy`. Arbitrary field sorting is therefore
 * impossible by construction.
 */
export const newsSortSchema = z.enum(['newest', 'oldest']).default('newest');
export const eventSortSchema = z.enum(['upcoming', 'recent']).default('upcoming');
export const campaignSortSchema = z.enum(['newest', 'goal']).default('newest');
export type NewsSort = z.infer<typeof newsSortSchema>;
export type EventSort = z.infer<typeof eventSortSchema>;
export type CampaignSort = z.infer<typeof campaignSortSchema>;

/** Query for lists that support both a category and a sort. */
export const collectionQuerySchema = listQuerySchema.merge(categoryQuerySchema);
export type CollectionQuery = z.infer<typeof collectionQuerySchema>;

/** A media reference as it appears in public content. */
export const mediaRefSchema = z.object({
  id: z.uuid(),
  alt: z.string().min(1).max(300),
  caption: z.string().max(400).nullable(),
  credit: z.string().max(200).nullable(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
});
export type MediaRef = z.infer<typeof mediaRefSchema>;

/** SEO metadata carried by every publishing entity. */
export const seoMetaSchema = z.object({
  title: z.string().max(70).nullable(),
  description: z.string().max(180).nullable(),
  canonicalUrl: z.string().max(2000).nullable(),
  noindex: z.boolean(),
});
export type SeoMeta = z.infer<typeof seoMetaSchema>;

/** A call to action, as stored in section blocks. */
export const ctaSchema = z.object({
  label: z.string().min(1).max(60),
  href: z.string().min(1).max(300),
});
export type Cta = z.infer<typeof ctaSchema>;
