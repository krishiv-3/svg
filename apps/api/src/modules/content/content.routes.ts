import express, { type Response, type Router } from 'express';

import { NotFoundError } from '../../core/http/errors.js';

import type { ContentModule } from './index.js';
import type { CampaignDetailDto, CampaignSummaryDto } from './dto.js';

/**
 * Public content API.
 *
 * Read-only, unauthenticated and cacheable. Every handler delegates to a service
 * from the content module, so the publishing rules live in exactly one place and
 * a route cannot accidentally query the database itself.
 *
 * Response shape follows docs/API_DESIGN.md §4: `{ data }` for a resource,
 * `{ data, meta }` for a collection. Money is `{ amountMinor, currency }`.
 */

const PUBLIC_CACHE = 'public, max-age=60, stale-while-revalidate=300';

function ok<T>(response: Response, data: T): void {
  response.setHeader('Cache-Control', PUBLIC_CACHE).status(200).json({ data });
}

function okCollection<T>(
  response: Response,
  page: { items: readonly T[]; nextCursor: string | null },
  limit: number,
): void {
  response
    .setHeader('Cache-Control', PUBLIC_CACHE)
    .status(200)
    .json({
      data: page.items,
      meta: { pagination: { limit, nextCursor: page.nextCursor } },
    });
}

/** Convert the service DTO's flat amounts into the documented money object. */
function serialiseCampaign(dto: CampaignSummaryDto) {
  const { targetAmountMinor, raisedMinor, currency, ...rest } = dto;

  return {
    ...rest,
    target: { amountMinor: targetAmountMinor, currency },
    raised: { amountMinor: raisedMinor, currency },
  };
}

function serialiseCampaignDetail(dto: CampaignDetailDto) {
  const { targetAmountMinor, raisedMinor, currency, ...rest } = dto;

  return {
    ...rest,
    target: { amountMinor: targetAmountMinor, currency },
    raised: { amountMinor: raisedMinor, currency },
  };
}

export interface PublicContentRouterDependencies {
  readonly content: ContentModule;
}

export function createPublicContentRouter(dependencies: PublicContentRouterDependencies): Router {
  const { content } = dependencies;
  const router = express.Router();

  /* ------------------------------------------------------------- homepage */
  router.get('/homepage', async (_request, response) => {
    const result = await content.homepage.get();

    if (result === null) {
      // A draft homepage is not public. The bootstrap creates it as DRAFT, so a
      // fresh database answers 404 here until an editor publishes it.
      throw new NotFoundError('Homepage is not published');
    }

    const payload = {
      page: result.homepage.page,
      sections: result.homepage.sections.map((section) =>
        section.campaign === undefined || section.campaign === null
          ? section
          : { ...section, campaign: serialiseCampaignDetail(section.campaign) },
      ),
    };

    ok(response, payload);
  });

  /* ---------------------------------------------------------------- pages */
  router.get('/pages/:slug', async (request, response) => {
    ok(response, await content.pages.getBySlug(request.params.slug));
  });

  /* ----------------------------------------------------------- activities */
  router.get('/activities', async (request, response) => {
    const page = await content.activities.list(request.query);
    okCollection(response, page, page.items.length === 0 ? 0 : Number(request.query.limit ?? 12));
  });

  router.get('/activities/:slug', async (request, response) => {
    ok(response, await content.activities.getBySlug(request.params.slug));
  });

  /* ------------------------------------------------------------ campaigns */
  router.get('/campaigns', async (request, response) => {
    const page = await content.campaigns.list(request.query);

    response
      .setHeader('Cache-Control', PUBLIC_CACHE)
      .status(200)
      .json({
        data: page.items.map(serialiseCampaign),
        meta: {
          pagination: {
            limit: Number(request.query.limit ?? 12),
            nextCursor: page.nextCursor,
          },
        },
      });
  });

  router.get('/campaigns/:slug', async (request, response) => {
    ok(response, serialiseCampaignDetail(await content.campaigns.getBySlug(request.params.slug)));
  });

  /* --------------------------------------------------------------- events */
  router.get('/events', async (request, response) => {
    const page = await content.events.list(request.query);
    okCollection(response, page, page.items.length === 0 ? 0 : Number(request.query.limit ?? 12));
  });

  router.get('/events/:slug', async (request, response) => {
    ok(response, await content.events.getBySlug(request.params.slug));
  });

  /* ----------------------------------------------------------------- news */
  router.get('/news/categories', async (_request, response) => {
    ok(response, await content.news.listCategories());
  });

  router.get('/news', async (request, response) => {
    const page = await content.news.list(request.query);
    okCollection(response, page, page.items.length === 0 ? 0 : Number(request.query.limit ?? 12));
  });

  router.get('/news/:slug', async (request, response) => {
    const result = await content.news.getBySlug(request.params.slug);

    // The article is the resource; related reading travels in `meta` so the
    // envelope stays `{ data: <resource> }` (docs/API_DESIGN.md §4).
    response
      .setHeader('Cache-Control', PUBLIC_CACHE)
      .status(200)
      .json({ data: result.article, meta: { related: result.related } });
  });

  /* -------------------------------------------------------------- gallery */
  router.get('/gallery/albums', async (_request, response) => {
    ok(response, await content.gallery.listAlbums());
  });

  router.get('/gallery', async (request, response) => {
    const result = await content.gallery.list(request.query);

    response
      .setHeader('Cache-Control', PUBLIC_CACHE)
      .status(200)
      .json({
        data: result.items.items,
        meta: {
          pagination: {
            limit: Number(request.query.limit ?? 12),
            nextCursor: result.items.nextCursor,
          },
          albums: result.albums,
        },
      });
  });

  /* -------------------------------------------------- impact + testimonials */
  router.get('/impact', async (_request, response) => {
    ok(response, await content.impact.listPublic());
  });

  router.get('/testimonials', async (_request, response) => {
    ok(response, await content.testimonials.listPublic());
  });

  return router;
}
