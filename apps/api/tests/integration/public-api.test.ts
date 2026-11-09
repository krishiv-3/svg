import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { uuidv7 } from '@gaushala/shared';

import { createApp } from '../../src/app.js';
import { createLogger } from '../../src/core/logging/logger.js';
import { appClient, ownerClient, testEnv } from './helpers.js';

/**
 * Public content API.
 *
 * Exercises the routes end to end against real PostgreSQL: envelope shape,
 * publishing visibility, pagination, filters, invalid input and 404 handling.
 */

const config = testEnv();
const prisma = appClient();
const owner = ownerClient();
const app = createApp({ config, logger: createLogger({ level: 'silent' }), prisma });

const PREFIX = `api-${String(Date.now())}`;
const DAY = 86_400_000;
const now = Date.now();
const days = (n: number): Date => new Date(now + n * DAY);

const ids: { pages: string[]; campaigns: string[]; news: string[]; events: string[] } = {
  pages: [],
  campaigns: [],
  news: [],
  events: [],
};

beforeAll(async () => {
  // The seed guarantees one homepage row, so clear it before this file publishes
  // its own (the unique index allows exactly one live homepage).
  await owner.page.deleteMany({ where: { kind: 'HOMEPAGE' } });

  const category = await owner.newsCategory.create({
    data: { id: uuidv7(), name: 'API Updates', slug: `${PREFIX}-cat` },
    select: { id: true },
  });

  const campaign = await owner.campaign.create({
    data: {
      id: uuidv7(),
      slug: `${PREFIX}-campaign`,
      name: 'API campaign',
      purposeSummary: 'Purpose',
      story: { paragraphs: ['Story paragraph.'] },
      startDate: days(-5),
      progressSource: 'MANUAL',
      manualRaisedMinor: 10_000n,
      manualRaisedNote: 'Fixture',
      targetAmountMinor: 100_000n,
      status: 'PUBLISHED',
      publishedAt: days(-1),
    },
    select: { id: true },
  });
  ids.campaigns.push(campaign.id);

  const draftCampaign = await owner.campaign.create({
    data: {
      id: uuidv7(),
      slug: `${PREFIX}-campaign-draft`,
      name: 'Draft campaign',
      purposeSummary: 'Hidden',
      story: { paragraphs: ['Hidden.'] },
      startDate: days(-5),
      status: 'DRAFT',
    },
    select: { id: true },
  });
  ids.campaigns.push(draftCampaign.id);

  const article = await owner.newsPost.create({
    data: {
      id: uuidv7(),
      slug: `${PREFIX}-news`,
      title: 'API article',
      excerpt: 'Excerpt',
      body: { paragraphs: ['Body.'] },
      categoryId: category.id,
      status: 'PUBLISHED',
      publishedAt: days(-1),
    },
    select: { id: true },
  });
  ids.news.push(article.id);

  const scheduled = await owner.newsPost.create({
    data: {
      id: uuidv7(),
      slug: `${PREFIX}-news-scheduled`,
      title: 'Scheduled article',
      excerpt: 'Hidden',
      body: { paragraphs: ['Hidden.'] },
      status: 'SCHEDULED',
      scheduledFor: days(3),
    },
    select: { id: true },
  });
  ids.news.push(scheduled.id);

  const event = await owner.event.create({
    data: {
      id: uuidv7(),
      slug: `${PREFIX}-event`,
      title: 'API event',
      description: { paragraphs: ['Event body.'] },
      startAt: days(5),
      status: 'PUBLISHED',
      publishedAt: days(-1),
    },
    select: { id: true },
  });
  ids.events.push(event.id);

  const homepage = await owner.page.create({
    data: {
      id: uuidv7(),
      kind: 'HOMEPAGE',
      slug: '',
      title: 'Homepage',
      template: 'HOMEPAGE',
      status: 'PUBLISHED',
      publishedAt: days(-1),
      sections: {
        create: [
          {
            id: uuidv7(),
            type: 'hero',
            sortOrder: 0,
            content: {
              schemaVersion: 1,
              heading: 'API homepage',
              description: 'Served from the database.',
              primaryCta: { label: 'Donate', href: '/donate' },
            },
          },
        ],
      },
    },
    select: { id: true },
  });
  ids.pages.push(homepage.id);
});

afterAll(async () => {
  await owner.pageSection.deleteMany({ where: { pageId: { in: ids.pages } } });
  await owner.page.deleteMany({ where: { id: { in: ids.pages } } });
  await owner.campaign.deleteMany({ where: { id: { in: ids.campaigns } } });
  await owner.newsPost.deleteMany({ where: { id: { in: ids.news } } });
  await owner.event.deleteMany({ where: { id: { in: ids.events } } });
  await owner.newsCategory.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  await owner.$disconnect();
  await prisma.$disconnect();
});

describe('public content API', () => {
  it('serves the homepage with hydrated sections', async () => {
    const response = await request(app).get('/api/v1/public/homepage');

    expect(response.status).toBe(200);
    expect(response.body.data.page.kind).toBe('HOMEPAGE');
    expect(response.body.data.sections).toHaveLength(1);
    expect(response.body.data.sections[0].block.heading).toBe('API homepage');
    expect(response.headers['cache-control']).toContain('public');
  });

  it('lists only published campaigns and wraps money', async () => {
    const response = await request(app).get('/api/v1/public/campaigns');

    expect(response.status).toBe(200);

    const slugs = response.body.data.map((item: { slug: string }) => item.slug);
    expect(slugs).toContain(`${PREFIX}-campaign`);
    expect(slugs).not.toContain(`${PREFIX}-campaign-draft`);

    const campaign = response.body.data.find(
      (item: { slug: string }) => item.slug === `${PREFIX}-campaign`,
    );
    expect(campaign.target).toEqual({ amountMinor: 100_000, currency: 'INR' });
    expect(campaign.raised).toEqual({ amountMinor: 10_000, currency: 'INR' });
    expect(response.body.meta.pagination).toBeDefined();
  });

  it('returns campaign detail and 404 for an unknown or draft slug', async () => {
    const detail = await request(app).get(`/api/v1/public/campaigns/${PREFIX}-campaign`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.paragraphs).toEqual(['Story paragraph.']);

    const draft = await request(app).get(`/api/v1/public/campaigns/${PREFIX}-campaign-draft`);
    expect(draft.status).toBe(404);
    expect(draft.body.code).toBe('NOT_FOUND');

    const missing = await request(app).get('/api/v1/public/campaigns/does-not-exist');
    expect(missing.status).toBe(404);
  });

  it('paginates news and exposes categories', async () => {
    const first = await request(app).get('/api/v1/public/news?limit=1');

    expect(first.status).toBe(200);
    expect(first.body.data).toHaveLength(1);
    expect(first.body.meta.pagination.limit).toBe(1);

    const categories = await request(app).get('/api/v1/public/news/categories');
    expect(categories.status).toBe(200);
    expect(Array.isArray(categories.body.data)).toBe(true);
  });

  it('hides scheduled articles and returns article detail', async () => {
    const detail = await request(app).get(`/api/v1/public/news/${PREFIX}-news`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.title).toBe('API article');
    expect(detail.body.meta.related).toBeDefined();

    const scheduled = await request(app).get(`/api/v1/public/news/${PREFIX}-news-scheduled`);
    expect(scheduled.status).toBe(404);
  });

  it('filters events by window', async () => {
    const upcoming = await request(app).get('/api/v1/public/events?when=upcoming');
    expect(upcoming.status).toBe(200);
    expect(upcoming.body.data.map((item: { slug: string }) => item.slug)).toContain(
      `${PREFIX}-event`,
    );

    const past = await request(app).get('/api/v1/public/events?when=past');
    expect(past.status).toBe(200);
    expect(past.body.data.map((item: { slug: string }) => item.slug)).not.toContain(
      `${PREFIX}-event`,
    );
  });

  it('returns an empty gallery rather than failing when nothing is public', async () => {
    const response = await request(app).get('/api/v1/public/gallery');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('serves impact and testimonial collections', async () => {
    const impact = await request(app).get('/api/v1/public/impact');
    expect(impact.status).toBe(200);
    expect(Array.isArray(impact.body.data)).toBe(true);

    const testimonials = await request(app).get('/api/v1/public/testimonials');
    expect(testimonials.status).toBe(200);
    expect(Array.isArray(testimonials.body.data)).toBe(true);
  });

  it('rejects invalid query parameters with a problem document', async () => {
    const response = await request(app).get('/api/v1/public/news?limit=999');

    expect(response.status).toBe(422);
    expect(response.body.code).toBe('VALIDATION_FAILED');
    expect(response.body.type).toContain('validation-failed');
  });

  it('rejects a malformed cursor', async () => {
    const response = await request(app).get('/api/v1/public/news?cursor=not-a-cursor');

    expect(response.status).toBe(422);
  });

  it('404s for a page that is not published', async () => {
    const response = await request(app).get(`/api/v1/public/pages/${PREFIX}-missing`);

    expect(response.status).toBe(404);
  });

  it('includes a request id on every response', async () => {
    const response = await request(app).get('/api/v1/public/impact');
    expect(response.headers['x-request-id']).toBeDefined();
  });
});
