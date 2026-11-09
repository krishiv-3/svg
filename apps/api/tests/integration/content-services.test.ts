import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { uuidv7 } from '@gaushala/shared';

import { NotFoundError, ValidationError } from '../../src/core/http/errors.js';
import { createContentModule, type ContentModule } from '../../src/modules/content/index.js';
import { isPubliclyVisible } from '../../src/modules/content/visibility.js';
import { appClient, ownerClient } from './helpers.js';

/**
 * Phase 6B — repositories and services against real PostgreSQL.
 *
 * The point of these tests is the visibility rule: draft, scheduled, archived,
 * future-dated and soft-deleted content must be unreachable through every public
 * read, including a direct slug lookup. The fixtures deliberately include one of
 * each so a regression in `publicWhere()` fails here rather than in production.
 *
 * Fixtures are written with the owner role (the application role has no DDL and
 * these rows are setup, not application behaviour) and read through the
 * application role, which is the same path production uses.
 */

const owner = ownerClient();
const app = appClient();
const content: ContentModule = createContentModule(app);

const PREFIX = `svc-${String(Date.now())}`;
const NOW = Date.now();
const HOUR = 3_600_000;

const ids = {
  pages: [] as string[],
  news: [] as string[],
  events: [] as string[],
  campaigns: [] as string[],
  activities: [] as string[],
  media: [] as string[],
  mediaCategories: [] as string[],
  newsCategories: [] as string[],
  impact: [] as string[],
  testimonials: [] as string[],
  enquiries: [] as string[],
  revisions: [] as string[],
  users: [] as string[],
};

const days = (n: number): Date => new Date(NOW + n * 24 * HOUR);

beforeAll(async () => {
  // The database refuses a VERIFIED impact figure or an APPROVED testimonial
  // without a named reviewer, so the fixture creates one.
  const reviewer = await owner.user.create({
    data: {
      id: uuidv7(),
      email: `${PREFIX}@example.invalid`,
      name: 'Fixture Reviewer',
      status: 'INVITED',
    },
    select: { id: true },
  });
  ids.users.push(reviewer.id);

  const mediaCategory = await owner.mediaCategory.create({
    data: { id: uuidv7(), name: 'Schema Gallery', slug: `${PREFIX}-gallery`, kind: 'GALLERY' },
    select: { id: true },
  });
  ids.mediaCategories.push(mediaCategory.id);

  const emptyCategory = await owner.mediaCategory.create({
    data: { id: uuidv7(), name: 'Empty Album', slug: `${PREFIX}-empty`, kind: 'GALLERY' },
    select: { id: true },
  });
  ids.mediaCategories.push(emptyCategory.id);

  const newsCategory = await owner.newsCategory.create({
    data: { id: uuidv7(), name: 'Updates', slug: `${PREFIX}-updates` },
    select: { id: true },
  });
  ids.newsCategories.push(newsCategory.id);

  const emptyNewsCategory = await owner.newsCategory.create({
    data: { id: uuidv7(), name: 'Empty', slug: `${PREFIX}-empty-news` },
    select: { id: true },
  });
  ids.newsCategories.push(emptyNewsCategory.id);

  // Public, accessible image.
  const publicImage = await owner.media.create({
    data: {
      id: uuidv7(),
      storageKey: `2026/11/${PREFIX}-public.jpg`,
      originalFilename: 'public.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 2048n,
      checksumSha256: 'a'.repeat(64),
      kind: 'IMAGE',
      status: 'READY',
      isPublic: true,
      altText: 'Cows resting in the shade',
      categoryId: mediaCategory.id,
      createdAt: new Date(NOW - HOUR),
    },
    select: { id: true },
  });
  ids.media.push(publicImage.id);

  // Public but missing alt text: must be withheld.
  const noAlt = await owner.media.create({
    data: {
      id: uuidv7(),
      storageKey: `2026/11/${PREFIX}-noalt.jpg`,
      originalFilename: 'noalt.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 2048n,
      checksumSha256: 'b'.repeat(64),
      kind: 'IMAGE',
      status: 'READY',
      isPublic: true,
      categoryId: mediaCategory.id,
    },
    select: { id: true },
  });
  ids.media.push(noAlt.id);

  // Not public.
  const privateImage = await owner.media.create({
    data: {
      id: uuidv7(),
      storageKey: `2026/11/${PREFIX}-private.jpg`,
      originalFilename: 'private.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 2048n,
      checksumSha256: 'c'.repeat(64),
      kind: 'IMAGE',
      status: 'READY',
      isPublic: false,
      altText: 'Internal draft photo',
      categoryId: mediaCategory.id,
    },
    select: { id: true },
  });
  ids.media.push(privateImage.id);

  const coverId = publicImage.id;

  // --- News -----------------------------------------------------------------
  const newsRows = [
    {
      slug: `${PREFIX}-news-published`,
      title: 'Published article',
      status: 'PUBLISHED' as const,
      publishedAt: new Date(NOW - 2 * HOUR),
    },
    {
      slug: `${PREFIX}-news-second`,
      title: 'Second article',
      status: 'PUBLISHED' as const,
      publishedAt: new Date(NOW - 3 * HOUR),
    },
    { slug: `${PREFIX}-news-draft`, title: 'Draft article', status: 'DRAFT' as const },
    {
      slug: `${PREFIX}-news-scheduled`,
      title: 'Scheduled article',
      status: 'SCHEDULED' as const,
      scheduledFor: days(2),
    },
    {
      slug: `${PREFIX}-news-archived`,
      title: 'Archived article',
      status: 'ARCHIVED' as const,
      publishedAt: new Date(NOW - 5 * HOUR),
    },
    {
      slug: `${PREFIX}-news-future`,
      title: 'Future article',
      status: 'PUBLISHED' as const,
      publishedAt: days(1),
    },
    {
      slug: `${PREFIX}-news-deleted`,
      title: 'Deleted article',
      status: 'PUBLISHED' as const,
      publishedAt: new Date(NOW - 4 * HOUR),
      deletedAt: new Date(NOW - HOUR),
    },
  ];

  for (const row of newsRows) {
    const created = await owner.newsPost.create({
      data: {
        id: uuidv7(),
        slug: row.slug,
        title: row.title,
        excerpt: 'Excerpt for the article',
        body: { paragraphs: ['First paragraph.', 'Second paragraph.'] },
        categoryId: newsCategory.id,
        coverMediaId: coverId,
        status: row.status,
        publishedAt: 'publishedAt' in row ? row.publishedAt : null,
        scheduledFor: 'scheduledFor' in row ? row.scheduledFor : null,
        deletedAt: 'deletedAt' in row ? row.deletedAt : null,
      },
      select: { id: true },
    });
    ids.news.push(created.id);
  }

  // --- Events ---------------------------------------------------------------
  const eventRows = [
    {
      slug: `${PREFIX}-event-upcoming`,
      startAt: days(3),
      status: 'PUBLISHED' as const,
      publishedAt: new Date(NOW - HOUR),
    },
    {
      slug: `${PREFIX}-event-past`,
      startAt: days(-3),
      status: 'PUBLISHED' as const,
      publishedAt: new Date(NOW - HOUR),
    },
    { slug: `${PREFIX}-event-draft`, startAt: days(4), status: 'DRAFT' as const },
  ];

  for (const row of eventRows) {
    const created = await owner.event.create({
      data: {
        id: uuidv7(),
        slug: row.slug,
        title: 'Event title',
        description: { paragraphs: ['Event description.'] },
        startAt: row.startAt,
        status: row.status,
        publishedAt: 'publishedAt' in row ? row.publishedAt : null,
      },
      select: { id: true },
    });
    ids.events.push(created.id);
  }

  // --- Campaigns ------------------------------------------------------------
  const campaigns = [
    {
      slug: `${PREFIX}-campaign-featured`,
      isFeatured: true,
      progressSource: 'MANUAL' as const,
      manualRaisedMinor: 18_000_00n,
      targetAmountMinor: 50_000_00n,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(NOW - HOUR),
    },
    {
      slug: `${PREFIX}-campaign-verified`,
      isFeatured: false,
      progressSource: 'VERIFIED_DONATIONS' as const,
      targetAmountMinor: 20_000_00n,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(NOW - 2 * HOUR),
    },
    {
      slug: `${PREFIX}-campaign-draft`,
      isFeatured: false,
      progressSource: 'VERIFIED_DONATIONS' as const,
      status: 'DRAFT' as const,
    },
  ];

  for (const row of campaigns) {
    const created = await owner.campaign.create({
      data: {
        id: uuidv7(),
        slug: row.slug,
        name: 'Campaign',
        purposeSummary: 'Purpose summary',
        story: { paragraphs: ['Campaign story.'] },
        startDate: days(-10),
        progressSource: row.progressSource,
        manualRaisedMinor: 'manualRaisedMinor' in row ? row.manualRaisedMinor : null,
        manualRaisedNote: 'manualRaisedMinor' in row ? 'Recorded from bank statement' : null,
        targetAmountMinor: 'targetAmountMinor' in row ? row.targetAmountMinor : null,
        isFeatured: row.isFeatured,
        status: row.status,
        publishedAt: 'publishedAt' in row ? row.publishedAt : null,
      },
      select: { id: true },
    });
    ids.campaigns.push(created.id);
  }

  // A published update and a draft update on the featured campaign.
  const featuredId = ids.campaigns[0] as string;
  await owner.campaignUpdate.create({
    data: {
      id: uuidv7(),
      campaignId: featuredId,
      title: 'Published update',
      body: { paragraphs: ['Update body.'] },
      status: 'PUBLISHED',
      publishedAt: new Date(NOW - HOUR),
    },
  });
  await owner.campaignUpdate.create({
    data: {
      id: uuidv7(),
      campaignId: featuredId,
      title: 'Draft update',
      body: { paragraphs: ['Draft body.'] },
      status: 'DRAFT',
    },
  });

  // --- Activities -----------------------------------------------------------
  for (const row of [
    { slug: `${PREFIX}-activity-featured`, isFeatured: true },
    { slug: `${PREFIX}-activity-normal`, isFeatured: false },
    { slug: `${PREFIX}-activity-draft`, isFeatured: false, status: 'DRAFT' as const },
  ]) {
    const created = await owner.activity.create({
      data: {
        id: uuidv7(),
        slug: row.slug,
        title: 'Activity',
        shortDescription: 'Short description',
        body: { paragraphs: ['Activity body.'] },
        isFeatured: row.isFeatured,
        status: 'status' in row ? row.status : 'PUBLISHED',
        publishedAt: 'status' in row ? null : new Date(NOW - HOUR),
      },
      select: { id: true },
    });
    ids.activities.push(created.id);
  }

  // --- Impact and testimonials ---------------------------------------------
  const verified = await owner.impactStat.create({
    data: {
      id: uuidv7(),
      label: 'Cows under care',
      value: 120,
      methodology: 'Daily head count',
      displayOrder: 1,
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(NOW - HOUR),
      verifiedById: reviewer.id,
    },
    select: { id: true },
  });
  ids.impact.push(verified.id);

  const unverified = await owner.impactStat.create({
    data: {
      id: uuidv7(),
      label: 'Unverified figure',
      value: 999,
      methodology: 'Not checked',
      displayOrder: 2,
      verificationStatus: 'DRAFT',
    },
    select: { id: true },
  });
  ids.impact.push(unverified.id);

  const approved = await owner.testimonial.create({
    data: {
      id: uuidv7(),
      body: 'A kind word',
      displayName: 'Approved supporter',
      consentEvidence: 'Signed consent form dated 2026-01-01',
      consentDate: new Date('2026-01-01'),
      approvalStatus: 'APPROVED',
      approvedAt: new Date(NOW - HOUR),
      approvedById: reviewer.id,
      isVisible: true,
      displayOrder: 1,
    },
    select: { id: true },
  });
  ids.testimonials.push(approved.id);

  const pending = await owner.testimonial.create({
    data: {
      id: uuidv7(),
      body: 'Pending words',
      displayName: 'Pending supporter',
      consentEvidence: 'Awaiting signature',
      consentDate: new Date('2026-01-01'),
      approvalStatus: 'PENDING',
      isVisible: true,
      displayOrder: 2,
    },
    select: { id: true },
  });
  ids.testimonials.push(pending.id);

  // --- Pages ----------------------------------------------------------------
  const publishedPage = await owner.page.create({
    data: {
      id: uuidv7(),
      slug: `${PREFIX}-page-published`,
      title: 'Published page',
      status: 'PUBLISHED',
      publishedAt: new Date(NOW - HOUR),
      sections: {
        create: [
          {
            id: uuidv7(),
            type: 'hero',
            sortOrder: 0,
            content: {
              schemaVersion: 1,
              heading: 'Welcome',
              description: 'A description',
              primaryCta: { label: 'Donate', href: '/donate' },
            },
          },
          {
            id: uuidv7(),
            type: 'latest_news',
            sortOrder: 1,
            content: { schemaVersion: 1, limit: 2 },
          },
          {
            id: uuidv7(),
            type: 'not_a_real_block',
            sortOrder: 2,
            content: { anything: true },
          },
        ],
      },
    },
    select: { id: true },
  });
  ids.pages.push(publishedPage.id);

  const draftPage = await owner.page.create({
    data: { id: uuidv7(), slug: `${PREFIX}-page-draft`, title: 'Draft page', status: 'DRAFT' },
    select: { id: true },
  });
  ids.pages.push(draftPage.id);

  // --- Enquiries ------------------------------------------------------------
  const enquiry = await owner.enquiry.create({
    data: {
      id: uuidv7(),
      reference: `ENQ-9999-1${String(NOW).slice(-4)}`,
      type: 'CONTACT',
      name: 'Asha Verma',
      email: 'asha@example.com',
      subject: 'Visit',
      message: 'I would like to know when visits are possible, please.',
      consentGivenAt: new Date(NOW - HOUR),
      consentVersion: '2026-11-01',
    },
    select: { id: true },
  });
  ids.enquiries.push(enquiry.id);

  // --- Revisions ------------------------------------------------------------
  for (const version of [1, 2]) {
    const revision = await owner.revision.create({
      data: {
        id: uuidv7(),
        entityType: 'PAGE',
        entityId: publishedPage.id,
        version,
        status: version === 2 ? 'PUBLISHED' : 'SUPERSEDED',
        snapshot: { title: `v${String(version)}` },
        publishedAt: version === 2 ? new Date(NOW - HOUR) : null,
      },
      select: { id: true },
    });
    ids.revisions.push(revision.id);
  }
});

afterAll(async () => {
  await owner.campaignUpdate.deleteMany({ where: { campaignId: { in: ids.campaigns } } });
  await owner.revision.deleteMany({ where: { id: { in: ids.revisions } } });
  await owner.pageSection.deleteMany({ where: { pageId: { in: ids.pages } } });
  await owner.page.deleteMany({ where: { id: { in: ids.pages } } });
  await owner.newsPost.deleteMany({ where: { id: { in: ids.news } } });
  await owner.event.deleteMany({ where: { id: { in: ids.events } } });
  await owner.campaign.deleteMany({ where: { id: { in: ids.campaigns } } });
  await owner.activity.deleteMany({ where: { id: { in: ids.activities } } });
  await owner.media.deleteMany({ where: { id: { in: ids.media } } });
  await owner.mediaCategory.deleteMany({ where: { id: { in: ids.mediaCategories } } });
  await owner.newsCategory.deleteMany({ where: { id: { in: ids.newsCategories } } });
  await owner.impactStat.deleteMany({ where: { id: { in: ids.impact } } });
  await owner.testimonial.deleteMany({ where: { id: { in: ids.testimonials } } });
  await owner.enquiry.deleteMany({ where: { id: { in: ids.enquiries } } });
  await owner.user.deleteMany({ where: { id: { in: ids.users } } });
  await owner.$disconnect();
  await app.$disconnect();
});

describe('news', () => {
  it('returns only published, past-dated, non-deleted articles', async () => {
    const page = await content.news.list({ limit: 24 });
    const slugs = page.items.map((item) => item.slug);

    expect(slugs).toContain(`${PREFIX}-news-published`);
    expect(slugs).toContain(`${PREFIX}-news-second`);

    expect(slugs).not.toContain(`${PREFIX}-news-draft`);
    expect(slugs).not.toContain(`${PREFIX}-news-scheduled`);
    expect(slugs).not.toContain(`${PREFIX}-news-archived`);
    expect(slugs).not.toContain(`${PREFIX}-news-future`);
    expect(slugs).not.toContain(`${PREFIX}-news-deleted`);
  });

  it('filters by category slug and returns nothing for an unknown one', async () => {
    const matching = await content.news.list({ limit: 24, category: `${PREFIX}-updates` });
    expect(matching.items.length).toBeGreaterThan(0);

    const unknown = await content.news.list({ limit: 24, category: `${PREFIX}-nope` });
    expect(unknown.items).toHaveLength(0);
  });

  it('paginates with an opaque cursor', async () => {
    const first = await content.news.list({ limit: 1 });
    expect(first.items).toHaveLength(1);
    expect(first.nextCursor).not.toBeNull();

    const second = await content.news.list({ limit: 1, cursor: first.nextCursor ?? undefined });
    expect(second.items).toHaveLength(1);
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
  });

  it('rejects a malformed cursor with a validation error', async () => {
    await expect(content.news.list({ cursor: 'not-a-cursor' })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('returns article detail with related reading', async () => {
    const result = await content.news.getBySlug(`${PREFIX}-news-published`);

    expect(result.article.paragraphs).toEqual(['First paragraph.', 'Second paragraph.']);
    expect(result.article.category?.slug).toBe(`${PREFIX}-updates`);
    expect(result.related.every((item) => item.slug !== result.article.slug)).toBe(true);
  });

  it('hides unpublished articles behind a direct slug lookup', async () => {
    for (const slug of [
      `${PREFIX}-news-draft`,
      `${PREFIX}-news-scheduled`,
      `${PREFIX}-news-archived`,
      `${PREFIX}-news-future`,
      `${PREFIX}-news-deleted`,
      `${PREFIX}-news-missing`,
    ]) {
      await expect(content.news.getBySlug(slug)).rejects.toBeInstanceOf(NotFoundError);
    }
  });

  it('lists only categories that contain published articles', async () => {
    const categories = await content.news.listCategories();
    const slugs = categories.map((category) => category.slug);

    expect(slugs).toContain(`${PREFIX}-updates`);
    expect(slugs).not.toContain(`${PREFIX}-empty-news`);
  });

  it('rejects an invalid slug as not-found rather than a validation error', async () => {
    await expect(content.news.getBySlug('Not A Slug')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('events', () => {
  it('separates upcoming from past without leaking drafts', async () => {
    const upcoming = await content.events.list({ when: 'upcoming', limit: 24 });
    const past = await content.events.list({ when: 'past', limit: 24 });

    expect(upcoming.items.map((item) => item.slug)).toContain(`${PREFIX}-event-upcoming`);
    expect(upcoming.items.map((item) => item.slug)).not.toContain(`${PREFIX}-event-past`);
    expect(upcoming.items.map((item) => item.slug)).not.toContain(`${PREFIX}-event-draft`);

    expect(past.items.map((item) => item.slug)).toContain(`${PREFIX}-event-past`);
    expect(past.items.map((item) => item.slug)).not.toContain(`${PREFIX}-event-draft`);
  });

  it('returns detail and hides a draft event', async () => {
    const event = await content.events.getBySlug(`${PREFIX}-event-upcoming`);
    expect(event.timezone).toBe('Asia/Kolkata');

    await expect(content.events.getBySlug(`${PREFIX}-event-draft`)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe('campaigns', () => {
  it('lists published campaigns only', async () => {
    const page = await content.campaigns.list({ limit: 24 });
    const slugs = page.items.map((item) => item.slug);

    expect(slugs).toContain(`${PREFIX}-campaign-featured`);
    expect(slugs).toContain(`${PREFIX}-campaign-verified`);
    expect(slugs).not.toContain(`${PREFIX}-campaign-draft`);
  });

  it('resolves the raised amount from the campaign’s declared source', async () => {
    const page = await content.campaigns.list({ limit: 24 });

    const manual = page.items.find((item) => item.slug === `${PREFIX}-campaign-featured`);
    const verified = page.items.find((item) => item.slug === `${PREFIX}-campaign-verified`);

    // Manual totals are explicit; verified totals are unknown until donations exist.
    expect(manual?.raisedMinor).toBe(1_800_000);
    expect(verified?.raisedMinor).toBeNull();
    expect(manual?.targetAmountMinor).toBe(5_000_000);
  });

  it('returns the featured campaign and its published updates only', async () => {
    const featured = await content.campaigns.getFeatured();

    expect(featured?.slug).toBe(`${PREFIX}-campaign-featured`);
    expect(featured?.updates.map((update) => update.title)).toEqual(['Published update']);
    expect(featured?.paragraphs).toEqual(['Campaign story.']);
  });

  it('hides a draft campaign behind a slug lookup', async () => {
    await expect(content.campaigns.getBySlug(`${PREFIX}-campaign-draft`)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe('activities', () => {
  it('lists published activities and promotes featured ones on the homepage', async () => {
    const page = await content.activities.list({ limit: 24 });
    const slugs = page.items.map((item) => item.slug);

    expect(slugs).toContain(`${PREFIX}-activity-featured`);
    expect(slugs).not.toContain(`${PREFIX}-activity-draft`);

    const homepage = await content.activities.listForHomepage(4);
    expect(homepage[0]?.slug).toBe(`${PREFIX}-activity-featured`);
  });
});

describe('gallery', () => {
  it('serves only public, ready images that have alt text', async () => {
    const result = await content.gallery.list({ limit: 24 });
    const ids_ = result.items.items.map((item) => item.id);

    expect(ids_).toContain(ids.media[0]);
    expect(ids_).not.toContain(ids.media[1]);
    expect(ids_).not.toContain(ids.media[2]);
  });

  it('lists albums that contain public images only', async () => {
    const albumSlugs = (await content.gallery.listAlbums()).map((album) => album.slug);

    expect(albumSlugs).toContain(`${PREFIX}-gallery`);
    expect(albumSlugs).not.toContain(`${PREFIX}-empty`);
  });

  it('filters by album', async () => {
    const result = await content.gallery.list({ limit: 24, category: `${PREFIX}-gallery` });
    expect(result.items.items.length).toBe(1);
  });
});

describe('impact and testimonials', () => {
  it('serves verified impact figures only', async () => {
    const stats = await content.impact.listPublic();
    const labels = stats.map((stat) => stat.label);

    expect(labels).toContain('Cows under care');
    expect(labels).not.toContain('Unverified figure');
  });

  it('serves approved testimonials only', async () => {
    const quotes = (await content.testimonials.listPublic()).map((item) => item.displayName);

    expect(quotes).toContain('Approved supporter');
    expect(quotes).not.toContain('Pending supporter');
  });
});

describe('pages and sections', () => {
  it('returns a published page with validated sections', async () => {
    const page = await content.pages.getBySlug(`${PREFIX}-page-published`);

    const types = page.sections.map((section) => section.type);
    expect(types).toEqual(['hero', 'latest_news']);

    const hero = page.sections[0]?.block;
    expect(hero?.type).toBe('hero');
  });

  it('drops a section whose stored body fails validation', async () => {
    // The `not_a_real_block` row exists in the database but must not be rendered.
    const page = await content.pages.getBySlug(`${PREFIX}-page-published`);
    expect(page.sections).toHaveLength(2);
  });

  it('hides a draft page', async () => {
    await expect(content.pages.getBySlug(`${PREFIX}-page-draft`)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe('homepage', () => {
  it('guarantees the homepage row exists, idempotently and race-safely', async () => {
    await owner.page.deleteMany({ where: { kind: 'HOMEPAGE' } });

    const first = await content.homepage.ensureHomepage();
    expect(first.created).toBe(true);

    const second = await content.homepage.ensureHomepage();
    expect(second.created).toBe(false);
    expect(second.id).toBe(first.id);

    // Two callers racing must still end up with one row.
    const [a, b] = await Promise.all([
      content.homepage.ensureHomepage(),
      content.homepage.ensureHomepage(),
    ]);
    expect(a.id).toBe(b.id);

    const count = await owner.page.count({ where: { kind: 'HOMEPAGE', deletedAt: null } });
    expect(count).toBe(1);

    ids.pages.push(first.id);
  });

  it('does not publish the bootstrapped homepage', async () => {
    const homepage = await content.homepage.get();
    // The bootstrap creates a DRAFT, so it is not publicly readable.
    expect(homepage).toBeNull();
  });

  it('hydrates a published homepage’s blocks', async () => {
    await owner.page.updateMany({
      where: { kind: 'HOMEPAGE' },
      data: { status: 'PUBLISHED', publishedAt: new Date(NOW - HOUR) },
    });

    await owner.pageSection.deleteMany({
      where: { page: { kind: 'HOMEPAGE' } },
    });
    await owner.pageSection.createMany({
      data: [
        {
          id: uuidv7(),
          pageId: (await owner.page.findFirstOrThrow({ where: { kind: 'HOMEPAGE' } })).id,
          type: 'hero',
          sortOrder: 0,
          content: {
            schemaVersion: 1,
            heading: 'Home',
            description: 'Homepage description',
            primaryCta: { label: 'Donate', href: '/donate' },
          },
        },
        {
          id: uuidv7(),
          pageId: (await owner.page.findFirstOrThrow({ where: { kind: 'HOMEPAGE' } })).id,
          type: 'latest_news',
          sortOrder: 1,
          content: { schemaVersion: 1, limit: 2 },
        },
        {
          id: uuidv7(),
          pageId: (await owner.page.findFirstOrThrow({ where: { kind: 'HOMEPAGE' } })).id,
          type: 'impact',
          sortOrder: 2,
          content: { schemaVersion: 1, limit: 4 },
        },
      ],
    });

    const result = await content.homepage.get();

    expect(result).not.toBeNull();
    expect(result?.homepage.sections.map((section) => section.type)).toEqual([
      'hero',
      'latest_news',
      'impact',
    ]);

    const newsSection = result?.homepage.sections.find((section) => section.type === 'latest_news');
    expect(newsSection?.news?.length).toBeLessThanOrEqual(2);
    expect(newsSection?.news?.every((item) => !item.slug.endsWith('-draft'))).toBe(true);

    const impactSection = result?.homepage.sections.find((section) => section.type === 'impact');
    expect(impactSection?.impact?.every((stat) => stat.label !== 'Unverified figure')).toBe(true);
  });

  it('returns null rather than throwing when no homepage is published', async () => {
    await owner.page.updateMany({ where: { kind: 'HOMEPAGE' }, data: { status: 'DRAFT' } });
    await expect(content.homepage.get()).resolves.toBeNull();
  });
});

describe('revisions and version checks', () => {
  it('lists history newest first', async () => {
    const history = await content.revisions.history('PAGE', ids.pages[0] as string);
    expect(history.map((revision) => revision.version)).toEqual([2, 1]);
  });

  it('returns the published revision snapshot', async () => {
    const published = await content.revisions.published('PAGE', ids.pages[0] as string);
    expect(published?.snapshot).toEqual({ title: 'v2' });
  });

  it('refuses to overwrite a stored snapshot', async () => {
    await expect(
      owner.revision.update({
        where: { id: ids.revisions[0] as string },
        data: { snapshot: { title: 'tampered' } },
      }),
    ).rejects.toThrow(/immutable/i);
  });

  it('detects a stale version and accepts a matching one', async () => {
    const entityId = ids.pages[0] as string;

    await expect(content.revisions.checkVersion('PAGE', entityId, 2)).resolves.toEqual({
      current: 2,
      matches: true,
    });

    await expect(content.revisions.assertVersion('PAGE', entityId, 1)).rejects.toMatchObject({
      code: 'VERSION_CONFLICT',
      status: 409,
    });
  });
});

describe('enquiries (internal reads)', () => {
  it('lists enquiries with a consistent total', async () => {
    const result = await content.enquiries.list({ limit: 10 });
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.items.some((item) => item.id === ids.enquiries[0])).toBe(true);
  });

  it('returns detail and hides unknown ids', async () => {
    const detail = await content.enquiries.getById(ids.enquiries[0] as string);
    expect(detail.message).toContain('visits');

    await expect(content.enquiries.getById(uuidv7())).rejects.toBeInstanceOf(NotFoundError);
  });

  it('counts by status', async () => {
    const counts = await content.enquiries.counts();
    expect(counts.some((row) => row.status === 'NEW' && row.count >= 1)).toBe(true);
  });
});

describe('visibility helper', () => {
  it('matches the database predicate', () => {
    const now = new Date(NOW);

    expect(
      isPubliclyVisible(
        { status: 'PUBLISHED', publishedAt: new Date(NOW - HOUR), deletedAt: null },
        now,
      ),
    ).toBe(true);
    expect(
      isPubliclyVisible(
        { status: 'PUBLISHED', publishedAt: new Date(NOW + HOUR), deletedAt: null },
        now,
      ),
    ).toBe(false);
    expect(isPubliclyVisible({ status: 'DRAFT', publishedAt: null, deletedAt: null }, now)).toBe(
      false,
    );
    expect(
      isPubliclyVisible(
        { status: 'PUBLISHED', publishedAt: new Date(NOW - HOUR), deletedAt: new Date(NOW) },
        now,
      ),
    ).toBe(false);
  });
});
