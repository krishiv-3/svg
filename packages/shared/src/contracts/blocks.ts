import { z } from 'zod';

import { ctaSchema } from './content.js';

/**
 * Page-section blocks.
 *
 * `pages` + `page_sections` store the homepage (and future static pages) as
 * ordered, typed blocks with a JSON body. The database can only prove the body
 * is an object; these schemas are what make the content safe to render.
 *
 * Rules:
 *  - every block carries `schemaVersion`, so a stored document is always read
 *    against the schema it was written with;
 *  - unknown block types are rejected rather than rendered;
 *  - nothing here is HTML — bodies are arrays of paragraphs.
 */

const paragraph = z.string().min(1).max(2000);
const heading = z.string().min(1).max(200);
const shortText = z.string().max(400);

const base = {
  schemaVersion: z.literal(1),
};

export const heroBlockSchema = z.object({
  ...base,
  type: z.literal('hero'),
  eyebrow: z.string().max(60).optional(),
  heading: z.string().min(1).max(120),
  description: z.string().min(1).max(400),
  primaryCta: ctaSchema,
  secondaryCta: ctaSchema.optional(),
  imageId: z.uuid().optional(),
  footnote: z.string().max(200).optional(),
});

export const trustStripBlockSchema = z.object({
  ...base,
  type: z.literal('trust_strip'),
  items: z
    .array(z.object({ label: z.string().min(1).max(60), value: z.string().max(60).optional() }))
    .min(1)
    .max(6),
});

export const aboutPreviewBlockSchema = z.object({
  ...base,
  type: z.literal('about_preview'),
  heading,
  body: z.array(paragraph).min(1).max(5),
  link: ctaSchema.optional(),
  imageId: z.uuid().optional(),
});

export const whatWeDoBlockSchema = z.object({
  ...base,
  type: z.literal('what_we_do'),
  heading: heading.optional(),
  description: shortText.optional(),
  limit: z.number().int().min(1).max(8).default(4),
});

export const impactBlockSchema = z.object({
  ...base,
  type: z.literal('impact'),
  heading: heading.optional(),
  description: shortText.optional(),
  limit: z.number().int().min(1).max(8).default(4),
});

export const featuredCampaignBlockSchema = z.object({
  ...base,
  type: z.literal('featured_campaign'),
  campaignId: z.uuid().optional(),
});

export const latestNewsBlockSchema = z.object({
  ...base,
  type: z.literal('latest_news'),
  heading: heading.optional(),
  limit: z.number().int().min(1).max(6).default(3),
});

export const latestEventsBlockSchema = z.object({
  ...base,
  type: z.literal('latest_events'),
  heading: heading.optional(),
  limit: z.number().int().min(1).max(6).default(3),
});

export const galleryPreviewBlockSchema = z.object({
  ...base,
  type: z.literal('gallery_preview'),
  heading: heading.optional(),
  limit: z.number().int().min(1).max(12).default(6),
  categoryId: z.uuid().optional(),
});

export const supportCtaBlockSchema = z.object({
  ...base,
  type: z.literal('support_cta'),
  heading,
  description: z.string().min(1).max(400),
  cta: ctaSchema,
  note: z.string().max(200).optional(),
});

export const contactBlockSchema = z.object({
  ...base,
  type: z.literal('contact_block'),
  heading,
  body: z.array(paragraph).max(4).optional(),
});

export const richTextBlockSchema = z.object({
  ...base,
  type: z.literal('rich_text'),
  body: z.array(paragraph).min(1),
});

/** Every block type the renderer understands. */
export const blockSchema = z.discriminatedUnion('type', [
  heroBlockSchema,
  trustStripBlockSchema,
  aboutPreviewBlockSchema,
  whatWeDoBlockSchema,
  impactBlockSchema,
  featuredCampaignBlockSchema,
  latestNewsBlockSchema,
  latestEventsBlockSchema,
  galleryPreviewBlockSchema,
  supportCtaBlockSchema,
  contactBlockSchema,
  richTextBlockSchema,
]);

export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block['type'];

/** The block-type set on its own, for payloads that reference a type. */
export const blockTypeSchema = z.enum([
  'hero',
  'trust_strip',
  'about_preview',
  'what_we_do',
  'impact',
  'featured_campaign',
  'latest_news',
  'latest_events',
  'gallery_preview',
  'support_cta',
  'contact_block',
  'rich_text',
]);

export const BLOCK_TYPES: readonly BlockType[] = [
  'hero',
  'trust_strip',
  'about_preview',
  'what_we_do',
  'impact',
  'featured_campaign',
  'latest_news',
  'latest_events',
  'gallery_preview',
  'support_cta',
  'contact_block',
  'rich_text',
] as const;

export interface BlockParseResult {
  readonly ok: boolean;
  readonly block?: Block;
  /** Field-level problems, safe to log; never returned to a public client. */
  readonly issues?: readonly { path: string; message: string }[];
}

/**
 * Validate one stored section.
 *
 * Callers pass the row's `type` and raw `content`; an unknown type, a mismatched
 * `type` inside the body, or a schema violation all produce `ok: false` rather
 * than an exception, because a single malformed section must not take a page
 * down. The service decides whether to skip or surface it.
 */
export function parseSectionBlock(type: string, content: unknown): BlockParseResult {
  const candidate =
    typeof content === 'object' && content !== null && !Array.isArray(content)
      ? { ...(content as Record<string, unknown>), type }
      : { type };

  const result = blockSchema.safeParse(candidate);

  if (result.success) {
    return { ok: true, block: result.data };
  }

  return {
    ok: false,
    issues: result.error.issues.map((issue) => ({
      path: issue.path.map((segment) => String(segment)).join('.') || '(root)',
      message: issue.message,
    })),
  };
}

/** True when a stored type is one the renderer supports. */
export function isKnownBlockType(type: string): type is BlockType {
  return (BLOCK_TYPES as readonly string[]).includes(type);
}
