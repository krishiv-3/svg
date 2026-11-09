import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { uuidv7 } from '@gaushala/shared';

import { PrismaClient } from '../src/generated/prisma/client.js';

/**
 * Preview content — **development only**.
 *
 * Populates a small, explicitly fictional dataset so the database-backed site can
 * be reviewed before a CMS exists. It is deliberately a separate, manually run
 * command:
 *
 *   pnpm --filter @gaushala/api exec tsx prisma/preview-content.ts
 *
 * It refuses to run in production, and the normal seed never inserts content —
 * a fresh database therefore serves no fictional records, only a draft homepage.
 */

const appEnv = process.env.APP_ENV ?? 'development';
const nodeEnv = process.env.NODE_ENV ?? 'development';

if (appEnv === 'production' || nodeEnv === 'production') {
  console.error('preview-content: refusing to run in production.');
  process.exit(1);
}

const connectionString = process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL;

if (connectionString === undefined) {
  console.error('preview-content: MIGRATE_DATABASE_URL or DATABASE_URL is required.');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const NOW = Date.now();
const days = (n: number): Date => new Date(NOW + n * 86_400_000);

async function user(email: string, name: string): Promise<string> {
  const row = await prisma.user.upsert({
    where: { email },
    update: {},
    // INVITED, not ACTIVE: the database refuses an active account without a
    // password, and authentication does not exist yet.
    create: { id: uuidv7(), email, name, status: 'INVITED', isSuperAdmin: false },
    select: { id: true },
  });

  return row.id;
}

async function main(): Promise<void> {
  const reviewerId = await user('preview.reviewer@example.invalid', 'Preview Reviewer');

  const galleryCategory = await prisma.mediaCategory.upsert({
    where: { slug: 'preview-gallery' },
    update: {},
    create: { id: uuidv7(), name: 'Daily care', slug: 'preview-gallery', kind: 'GALLERY' },
    select: { id: true },
  });

  const category = await prisma.newsCategory.upsert({
    where: { slug: 'preview-updates' },
    update: {},
    create: { id: uuidv7(), name: 'Updates', slug: 'preview-updates', sortOrder: 1 },
    select: { id: true },
  });

  const mediaIds: string[] = [];
  for (const [index, caption] of ['Morning feeding', 'Shelter courtyard', 'Health check'].entries()) {
    const row = await prisma.media.upsert({
      where: { storageKey: `preview/${String(index)}.jpg` },
      update: {},
      create: {
        id: uuidv7(),
        storageKey: `preview/${String(index)}.jpg`,
        bucket: 'public',
        originalFilename: `preview-${String(index)}.jpg`,
        mimeType: 'image/jpeg',
        sizeBytes: 120_000n,
        checksumSha256: String(index + 1).repeat(64).slice(0, 64),
        kind: 'IMAGE',
        status: 'READY',
        isPublic: true,
        altText: `${caption} at the gaushala (preview photograph)`,
        caption,
        categoryId: galleryCategory.id,
      },
      select: { id: true },
    });
    mediaIds.push(row.id);
  }

  const campaigns = [
    {
      slug: 'preview-winter-fodder',
      name: 'Winter fodder fund',
      purpose: 'Fodder through the coldest weeks, when grazing is scarce.',
      target: 50_000_00n,
      raised: 18_000_00n,
      featured: true,
    },
    {
      slug: 'preview-shelter-repair',
      name: 'Shelter repair appeal',
      purpose: 'Repairs to the shaded resting area before the summer heat.',
      target: 20_000_00n,
      raised: 7_500_00n,
      featured: false,
    },
  ];

  for (const [index, campaign] of campaigns.entries()) {
    // `slug` is unique only among live rows (partial index), so Prisma cannot
    // upsert on it; check first to stay idempotent.
    const existingCampaign = await prisma.campaign.findFirst({
      where: { slug: campaign.slug },
      select: { id: true },
    });
    if (existingCampaign !== null) continue;

    await prisma.campaign.create({
      data: {
        id: uuidv7(),
        slug: campaign.slug,
        name: campaign.name,
        purposeSummary: campaign.purpose,
        story: {
          paragraphs: [
            campaign.purpose,
            'Preview content: this campaign is a development fixture, not a real appeal.',
          ],
        },
        targetAmountMinor: campaign.target,
        startDate: days(-20),
        progressSource: 'MANUAL',
        manualRaisedMinor: campaign.raised,
        manualRaisedNote: 'Preview fixture total',
        isFeatured: campaign.featured,
        status: 'PUBLISHED',
        publishedAt: days(-2),
        coverMediaId: mediaIds[index] ?? null,
      },
    });
  }

  const events = [
    { slug: 'preview-open-day', title: 'Community open day', start: days(12), status: 'SCHEDULED' },
    { slug: 'preview-volunteer-morning', title: 'Volunteer morning', start: days(20), status: 'SCHEDULED' },
    { slug: 'preview-workshop', title: 'Winter care workshop', start: days(-18), status: 'COMPLETED' },
  ];

  for (const event of events) {
    const existingEvent = await prisma.event.findFirst({
      where: { slug: event.slug },
      select: { id: true },
    });
    if (existingEvent !== null) continue;

    await prisma.event.create({
      data: {
        id: uuidv7(),
        slug: event.slug,
        title: event.title,
        description: {
          paragraphs: [
            'A preview event used to exercise the events listings and detail page.',
            'Preview content: dates and venues are fictional.',
          ],
        },
        startAt: event.start,
        timezone: 'Asia/Kolkata',
        venueName: 'Gaushala grounds',
        eventStatus: event.status as 'SCHEDULED' | 'COMPLETED',
        status: 'PUBLISHED',
        publishedAt: days(-3),
        posterMediaId: mediaIds[0] ?? null,
      },
    });
  }

  const articles = [
    { slug: 'preview-preparing-for-winter', title: 'Preparing the shelters for winter' },
    { slug: 'preview-morning-with-the-team', title: 'A morning with the care team' },
    { slug: 'preview-new-programme', title: 'Introducing a new activity programme' },
  ];

  for (const [index, article] of articles.entries()) {
    const existingArticle = await prisma.newsPost.findFirst({
      where: { slug: article.slug },
      select: { id: true },
    });
    if (existingArticle !== null) continue;

    await prisma.newsPost.create({
      data: {
        id: uuidv7(),
        slug: article.slug,
        title: article.title,
        excerpt: 'A preview article used to exercise the news listing and reading page.',
        body: {
          paragraphs: [
            'This is preview content. It exists so the database-backed news pages can be reviewed.',
            'Replace it with published articles from the CMS.',
          ],
        },
        categoryId: category.id,
        coverMediaId: mediaIds[index % mediaIds.length] ?? null,
        status: 'PUBLISHED',
        publishedAt: days(-(index + 1)),
      },
    });
  }

  const activities = [
    { slug: 'preview-nourishment', title: 'Daily Nourishment', summary: 'Fresh fodder and clean water every day.' },
    { slug: 'preview-care', title: 'Care and Wellbeing', summary: 'Daily checks and a quiet place to recover.' },
    { slug: 'preview-shelter', title: 'Safe Shelter', summary: 'Shade, ventilation and dry flooring.' },
    { slug: 'preview-community', title: 'Community Support', summary: 'Visits, volunteering and learning.' },
  ];

  for (const activity of activities) {
    const existingActivity = await prisma.activity.findFirst({
      where: { slug: activity.slug },
      select: { id: true },
    });
    if (existingActivity !== null) continue;

    await prisma.activity.create({
      data: {
        id: uuidv7(),
        slug: activity.slug,
        title: activity.title,
        shortDescription: activity.summary,
        body: { paragraphs: [activity.summary] },
        status: 'PUBLISHED',
        publishedAt: days(-30),
        mediaId: mediaIds[0] ?? null,
      },
    });
  }

  const stats = [
    { label: 'Cows under care', value: 120, unit: 'cows', order: 1 },
    { label: 'Days of feeding every year', value: 365, unit: 'days', order: 2 },
  ];

  for (const stat of stats) {
    const existing = await prisma.impactStat.findFirst({ where: { label: stat.label } });
    if (existing !== null) continue;

    await prisma.impactStat.create({
      data: {
        id: uuidv7(),
        label: stat.label,
        value: stat.value,
        unit: stat.unit,
        methodology: 'Preview fixture — not a verified figure.',
        displayOrder: stat.order,
        verificationStatus: 'VERIFIED',
        verifiedById: reviewerId,
        verifiedAt: days(-1),
      },
    });
  }

  const testimonial = await prisma.testimonial.findFirst({ where: { displayName: 'Preview supporter' } });
  if (testimonial === null) {
    await prisma.testimonial.create({
      data: {
        id: uuidv7(),
        body: 'Preview testimonial used to exercise the homepage section.',
        displayName: 'Preview supporter',
        consentEvidence: 'Preview fixture — not a real consent record',
        consentDate: days(-5),
        approvalStatus: 'APPROVED',
        approvedById: reviewerId,
        approvedAt: days(-4),
        isVisible: true,
        displayOrder: 1,
      },
    });
  }

  // Homepage: published, with the blocks the renderer expects.
  const existingHomepage = await prisma.page.findFirst({
    where: { kind: 'HOMEPAGE' },
    select: { id: true },
  });

  const homepage =
    existingHomepage === null
      ? await prisma.page.create({
          data: {
            id: uuidv7(),
            kind: 'HOMEPAGE',
            slug: '',
            title: 'Homepage',
            template: 'HOMEPAGE',
            status: 'PUBLISHED',
            publishedAt: days(-1),
          },
          select: { id: true },
        })
      : await prisma.page.update({
          where: { id: existingHomepage.id },
          data: { status: 'PUBLISHED', publishedAt: days(-1), deletedAt: null },
          select: { id: true },
        });

  await prisma.pageSection.deleteMany({ where: { pageId: homepage.id } });
  await prisma.pageSection.createMany({
    data: [
      {
        id: uuidv7(),
        pageId: homepage.id,
        type: 'hero',
        sortOrder: 0,
        content: {
          schemaVersion: 1,
          eyebrow: 'Care, every day',
          heading: 'Compassion Begins With Care.',
          description: 'Every cow deserves kindness, nourishment and a safe place to live.',
          primaryCta: { label: 'Donate', href: '/donate' },
          secondaryCta: { label: 'Learn about our work', href: '/our-work' },
          footnote: 'Preview build — content is served from the database.',
        },
      },
      {
        id: uuidv7(),
        pageId: homepage.id,
        type: 'about_preview',
        sortOrder: 1,
        content: {
          schemaVersion: 1,
          heading: 'A place built around care, not convenience.',
          body: [
            'A gaushala is a daily practice of attention, repeated every day.',
            'Preview copy: the organisation’s verified history will replace this text.',
          ],
          link: { label: 'Learn about the gaushala', href: '/about' },
        },
      },
      {
        id: uuidv7(),
        pageId: homepage.id,
        type: 'what_we_do',
        sortOrder: 2,
        content: { schemaVersion: 1, heading: 'Four commitments, every single day.', limit: 4 },
      },
      {
        id: uuidv7(),
        pageId: homepage.id,
        type: 'impact',
        sortOrder: 3,
        content: { schemaVersion: 1, heading: 'What care looks like in numbers.', limit: 4 },
      },
      {
        id: uuidv7(),
        pageId: homepage.id,
        type: 'featured_campaign',
        sortOrder: 4,
        content: { schemaVersion: 1 },
      },
      {
        id: uuidv7(),
        pageId: homepage.id,
        type: 'latest_news',
        sortOrder: 5,
        content: { schemaVersion: 1, heading: 'Updates from the gaushala.', limit: 3 },
      },
      {
        id: uuidv7(),
        pageId: homepage.id,
        type: 'latest_events',
        sortOrder: 6,
        content: { schemaVersion: 1, heading: 'Come and see the work.', limit: 3 },
      },
      {
        id: uuidv7(),
        pageId: homepage.id,
        type: 'gallery_preview',
        sortOrder: 7,
        content: { schemaVersion: 1, heading: 'Life at the gaushala.', limit: 6 },
      },
    ],
  });

  console.info('preview content ready: homepage published with 8 sections');
}

main()
  .catch((error: unknown) => {
    console.error('preview-content failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
