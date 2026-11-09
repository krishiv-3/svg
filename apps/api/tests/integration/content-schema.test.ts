import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { uuidv7 } from '@gaushala/shared';

import { ownerClient } from './helpers.js';

/**
 * Phase 6A — content schema and the constraints that encode the domain rules.
 *
 * These rules live in SQL (prisma/migrations/…_content_constraints) rather than
 * in application code, so they are tested directly against PostgreSQL: a bug in
 * a future service layer must not be able to publish a draft, verify a figure
 * without evidence, or approve a testimonial without consent.
 *
 * The owner role is used because these tests write fixtures; the application
 * role only has DML on rows it creates through the API.
 */

const prisma = ownerClient();
const PREFIX = `schema-test-${String(Date.now())}`;
const USER_EMAIL = `${PREFIX}@example.invalid`;

let userId = '';
/** Revision ids created by this file, so cleanup never touches other rows. */
const revisionIds: string[] = [];

const daysFromNow = (days: number): Date => new Date(Date.now() + days * 86_400_000);
/** Assert a Prisma write is rejected by a named CHECK constraint. */
async function expectRejected(promise: Promise<unknown>, pattern: RegExp): Promise<void> {
  await expect(promise).rejects.toThrow(pattern);
}

/**
 * Assert a write is rejected by a unique index.
 *
 * Prisma maps violations of indexes it knows about (`@@unique`) to a tidy error,
 * but the hand-written partial indexes are unknown to it, so the driver message
 * is wrapped in a generic validation error. The behaviour is therefore asserted
 * generically here, and the index itself is proven separately from
 * `pg_indexes` in the "unique indexes" test below.
 */
async function expectUniqueViolation(promise: Promise<unknown>): Promise<void> {
  await expect(promise).rejects.toThrow(/unique constraint|duplicate key/i);
}

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      id: uuidv7(),
      email: USER_EMAIL,
      name: 'Schema Test Reviewer',
      status: 'INVITED',
    },
    select: { id: true },
  });
  userId = user.id;
});

afterAll(async () => {
  // Order matters: children before parents.
  await prisma.enquiry.deleteMany({ where: { reference: { startsWith: 'ENQ-9999-' } } });
  await prisma.campaignUpdate.deleteMany({
    where: { campaign: { slug: { startsWith: PREFIX } } },
  });
  await prisma.campaign.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  await prisma.event.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  await prisma.newsPost.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  await prisma.activity.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  await prisma.page.deleteMany({
    where: { OR: [{ slug: { startsWith: PREFIX } }, { kind: 'HOMEPAGE' }] },
  });
  await prisma.revision.deleteMany({ where: { id: { in: revisionIds } } });
  await prisma.testimonial.deleteMany({ where: { displayName: { startsWith: PREFIX } } });
  await prisma.impactStat.deleteMany({ where: { label: { startsWith: PREFIX } } });
  await prisma.media.deleteMany({ where: { storageKey: { contains: PREFIX } } });
  await prisma.mediaCategory.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  await prisma.newsCategory.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  await prisma.user.deleteMany({ where: { email: USER_EMAIL } });
  await prisma.$disconnect();
});

describe('content schema', () => {
  it('created every Phase 6 content table', async () => {
    const rows = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    `;
    const tables = rows.map((row) => row.table_name);

    expect(tables).toEqual(
      expect.arrayContaining([
        'activities',
        'campaign_updates',
        'campaigns',
        'enquiries',
        'events',
        'impact_stats',
        'media',
        'media_categories',
        'news_categories',
        'news_posts',
        'page_sections',
        'pages',
        'revisions',
        'testimonials',
      ]),
    );
  });

  it('defines the publishing enum with exactly four states', async () => {
    const rows = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
      SELECT e.enumlabel
      FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'content_status'
      ORDER BY e.enumsortorder
    `;

    expect(rows.map((row) => row.enumlabel)).toEqual([
      'DRAFT',
      'SCHEDULED',
      'PUBLISHED',
      'ARCHIVED',
    ]);
  });

  it('creates the hand-written partial unique indexes', async () => {
    // These are the rules Prisma cannot express; they must exist in the database,
    // not just in the migration file.
    const rows = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname IN (
          'pages_slug_live_uniq',
          'pages_single_homepage',
          'campaigns_one_featured',
          'revisions_one_published'
        )
      ORDER BY indexname
    `;

    expect(rows.map((row) => row.indexname)).toEqual([
      'campaigns_one_featured',
      'pages_single_homepage',
      'pages_slug_live_uniq',
      'revisions_one_published',
    ]);
  });

  it('keeps the hand-written foreign keys that Prisma does not model', async () => {
    // `created_by`, `updated_by`, `og_image_id` and `current_revision_id` are
    // plain UUID columns in schema.prisma, with the real constraints added by
    // migration. Prisma's differ treats them as drift, so this test is the guard
    // that fails if someone accepts a generated migration that drops them.
    const rows = await prisma.$queryRaw<Array<{ conname: string }>>`
      SELECT conname FROM pg_constraint
      WHERE contype = 'f' AND connamespace = 'public'::regnamespace AND conname LIKE '%\_fk'
      ORDER BY conname
    `;
    const names = rows.map((row) => row.conname);

    const expected: string[] = [];
    for (const table of ['pages', 'activities', 'news_posts', 'events', 'campaigns']) {
      expected.push(`${table}_current_revision_fk`, `${table}_og_image_fk`);
    }
    for (const table of ['pages', 'activities', 'news_posts', 'events', 'campaigns']) {
      expected.push(`${table}_created_by_fk`, `${table}_updated_by_fk`);
    }

    expect(names.sort()).toEqual(expected.sort());
  });
});

describe('publishing lifecycle', () => {
  const basePage = {
    title: 'Schema test page',
    status: 'DRAFT' as const,
  };

  it('accepts a draft with no publication timestamps', async () => {
    const page = await prisma.page.create({
      data: { id: uuidv7(), slug: `${PREFIX}-draft`, ...basePage },
      select: { id: true, status: true },
    });

    expect(page.status).toBe('DRAFT');
  });

  it('refuses PUBLISHED without published_at', async () => {
    await expectRejected(
      prisma.page.create({
        data: {
          id: uuidv7(),
          slug: `${PREFIX}-published-no-date`,
          ...basePage,
          status: 'PUBLISHED',
        },
      }),
      /pages_status_published_requires_at/,
    );
  });

  it('refuses SCHEDULED without scheduled_for', async () => {
    await expectRejected(
      prisma.page.create({
        data: {
          id: uuidv7(),
          slug: `${PREFIX}-scheduled-no-date`,
          ...basePage,
          status: 'SCHEDULED',
        },
      }),
      /pages_status_scheduled_requires_for/,
    );
  });

  it('refuses a scheduled page that already claims a publication date', async () => {
    // Without this rule the public predicate (published_at <= now) would serve a
    // scheduled page before its time.
    await expectRejected(
      prisma.page.create({
        data: {
          id: uuidv7(),
          slug: `${PREFIX}-scheduled-with-date`,
          ...basePage,
          status: 'SCHEDULED',
          scheduledFor: daysFromNow(3),
          publishedAt: new Date(),
        },
      }),
      /pages_scheduled_not_yet_published/,
    );
  });

  it('accepts a correctly scheduled page', async () => {
    const page = await prisma.page.create({
      data: {
        id: uuidv7(),
        slug: `${PREFIX}-scheduled-ok`,
        ...basePage,
        status: 'SCHEDULED',
        scheduledFor: daysFromNow(3),
      },
      select: { status: true },
    });

    expect(page.status).toBe('SCHEDULED');
  });

  it('accepts a published page with a publication date', async () => {
    const page = await prisma.page.create({
      data: {
        id: uuidv7(),
        slug: `${PREFIX}-published-ok`,
        ...basePage,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      select: { status: true },
    });

    expect(page.status).toBe('PUBLISHED');
  });

  it('applies the same rule to news, events, campaigns and activities', async () => {
    const publishedAt = new Date();

    await expectRejected(
      prisma.newsPost.create({
        data: {
          id: uuidv7(),
          slug: `${PREFIX}-news-bad`,
          title: 'T',
          excerpt: 'E',
          body: {},
          status: 'PUBLISHED',
        },
      }),
      /news_posts_status_published_requires_at/,
    );

    await expectRejected(
      prisma.event.create({
        data: {
          id: uuidv7(),
          slug: `${PREFIX}-event-bad`,
          title: 'T',
          description: {},
          startAt: publishedAt,
          status: 'PUBLISHED',
        },
      }),
      /events_status_published_requires_at/,
    );

    await expectRejected(
      prisma.campaign.create({
        data: {
          id: uuidv7(),
          slug: `${PREFIX}-campaign-bad`,
          name: 'C',
          purposeSummary: 'P',
          story: {},
          startDate: new Date(),
          status: 'PUBLISHED',
        },
      }),
      /campaigns_status_published_requires_at/,
    );

    await expectRejected(
      prisma.activity.create({
        data: {
          id: uuidv7(),
          slug: `${PREFIX}-activity-bad`,
          title: 'A',
          shortDescription: 'S',
          status: 'PUBLISHED',
        },
      }),
      /activities_status_published_requires_at/,
    );
  });
});

describe('slug rules', () => {
  it('enforces one live page per slug, compared case-insensitively', async () => {
    // The slug format rule already forbids uppercase characters, so a case
    // variant cannot be inserted to prove the `lower(slug)` index. Its
    // definition is asserted instead, and duplicate live slugs are proven to be
    // rejected.
    const rows = await prisma.$queryRaw<Array<{ indexdef: string }>>`
      SELECT indexdef FROM pg_indexes
      WHERE schemaname = 'public' AND indexname = 'pages_slug_live_uniq'
    `;
    const definition = rows[0]?.indexdef ?? '';

    expect(definition).toMatch(/UNIQUE INDEX/i);
    expect(definition).toMatch(/lower\(/i);
    expect(definition).toMatch(/deleted_at/i);

    await prisma.page.create({
      data: { id: uuidv7(), slug: `${PREFIX}-slug`, title: 'One' },
    });

    await expectUniqueViolation(
      prisma.page.create({
        data: { id: uuidv7(), slug: `${PREFIX}-slug`, title: 'Two' },
      }),
    );
  });

  it('releases the slug when a row is soft-deleted', async () => {
    const first = await prisma.page.create({
      data: { id: uuidv7(), slug: `${PREFIX}-released`, title: 'One' },
      select: { id: true },
    });

    await prisma.page.update({ where: { id: first.id }, data: { deletedAt: new Date() } });

    const second = await prisma.page.create({
      data: { id: uuidv7(), slug: `${PREFIX}-released`, title: 'Two' },
      select: { id: true },
    });

    expect(second.id).not.toBe(first.id);
  });

  it('refuses malformed slugs', async () => {
    await expectRejected(
      prisma.page.create({
        data: { id: uuidv7(), slug: `${PREFIX}-Bad Slug`, title: 'T' },
      }),
      /pages_slug_format/,
    );
  });

  it('allows exactly one homepage and it owns the empty slug', async () => {
    // The seed guarantees a homepage row exists, so clear it before asserting
    // the singleton rule (the cleanup in afterAll removes ours).
    await prisma.page.deleteMany({ where: { kind: 'HOMEPAGE' } });

    const home = await prisma.page.create({
      data: { id: uuidv7(), kind: 'HOMEPAGE', slug: '', title: 'Home' },
      select: { id: true },
    });

    expect(home.id).toBeTruthy();

    await expectRejected(
      prisma.page.create({
        data: { id: uuidv7(), kind: 'HOMEPAGE', slug: 'home-two', title: 'Home two' },
      }),
      /pages_homepage_slug_empty/,
    );

    await expectUniqueViolation(
      prisma.page.create({
        data: { id: uuidv7(), kind: 'HOMEPAGE', slug: '', title: 'Home three' },
      }),
    );
  });
});

describe('campaign rules', () => {
  const baseCampaign = {
    name: 'Schema test campaign',
    purposeSummary: 'Purpose',
    story: {},
    startDate: new Date('2026-01-01'),
  };

  it('refuses a manual total without a stated note', async () => {
    await expectRejected(
      prisma.campaign.create({
        data: {
          id: uuidv7(),
          slug: `${PREFIX}-manual-no-note`,
          ...baseCampaign,
          progressSource: 'MANUAL',
          manualRaisedMinor: 100_00n,
        },
      }),
      /campaigns_manual_requires_evidence/,
    );
  });

  it('accepts a manual total with a note', async () => {
    const campaign = await prisma.campaign.create({
      data: {
        id: uuidv7(),
        slug: `${PREFIX}-manual-ok`,
        ...baseCampaign,
        progressSource: 'MANUAL',
        manualRaisedMinor: 100_00n,
        manualRaisedNote: 'Counted from bank statement, 2026-11-01',
        targetAmountMinor: 1_000_00n,
      },
      select: { progressSource: true },
    });

    expect(campaign.progressSource).toBe('MANUAL');
  });

  it('refuses a non-positive target', async () => {
    await expectRejected(
      prisma.campaign.create({
        data: {
          id: uuidv7(),
          slug: `${PREFIX}-bad-target`,
          ...baseCampaign,
          targetAmountMinor: 0n,
        },
      }),
      /campaigns_target_positive/,
    );
  });

  it('allows only one featured campaign', async () => {
    await prisma.campaign.create({
      data: { id: uuidv7(), slug: `${PREFIX}-featured-one`, ...baseCampaign, isFeatured: true },
    });

    await expectUniqueViolation(
      prisma.campaign.create({
        data: { id: uuidv7(), slug: `${PREFIX}-featured-two`, ...baseCampaign, isFeatured: true },
      }),
    );
  });
});

describe('impact and testimonial evidence gates', () => {
  it('refuses a VERIFIED figure without evidence', async () => {
    await expectRejected(
      prisma.impactStat.create({
        data: {
          id: uuidv7(),
          label: `${PREFIX} cows`,
          value: 120,
          methodology: 'Counted daily',
          displayOrder: 1,
          verificationStatus: 'VERIFIED',
        },
      }),
      /impact_verified_requires_evidence/,
    );
  });

  it('accepts a VERIFIED figure with a verifier, timestamp and methodology', async () => {
    const stat = await prisma.impactStat.create({
      data: {
        id: uuidv7(),
        label: `${PREFIX} cows under care`,
        value: 120,
        methodology: 'Head count recorded each morning',
        displayOrder: 2,
        verificationStatus: 'VERIFIED',
        verifiedById: userId,
        verifiedAt: new Date(),
      },
      select: { verificationStatus: true },
    });

    expect(stat.verificationStatus).toBe('VERIFIED');
  });

  it('refuses an APPROVED testimonial without consent evidence', async () => {
    await expectRejected(
      prisma.testimonial.create({
        data: {
          id: uuidv7(),
          body: 'A quote',
          displayName: `${PREFIX} supporter`,
          consentEvidence: '',
          consentDate: new Date('2026-01-01'),
          approvalStatus: 'APPROVED',
          approvedById: userId,
          approvedAt: new Date(),
        },
      }),
      /testimonials_approved_requires_consent/,
    );
  });
});

describe('event and enquiry rules', () => {
  it('refuses an event that ends before it starts', async () => {
    await expectRejected(
      prisma.event.create({
        data: {
          id: uuidv7(),
          slug: `${PREFIX}-bad-time`,
          title: 'T',
          description: {},
          startAt: new Date('2026-12-01T10:00:00Z'),
          endAt: new Date('2026-12-01T09:00:00Z'),
        },
      }),
      /events_time_order/,
    );
  });

  it('refuses an external registration mode without a URL', async () => {
    await expectRejected(
      prisma.event.create({
        data: {
          id: uuidv7(),
          slug: `${PREFIX}-bad-registration`,
          title: 'T',
          description: {},
          startAt: new Date('2026-12-01T10:00:00Z'),
          registrationMode: 'EXTERNAL_URL',
        },
      }),
      /events_external_url_required/,
    );
  });

  it('refuses an enquiry with an uppercase email or a short message', async () => {
    const base = {
      type: 'CONTACT' as const,
      name: 'Asha',
      consentGivenAt: new Date(),
      consentVersion: '2026-11-01',
    };

    await expectRejected(
      prisma.enquiry.create({
        data: {
          ...base,
          id: uuidv7(),
          reference: 'ENQ-9999-00001',
          email: 'Asha@Example.com',
          message: 'This message is long enough to pass the length rule.',
        },
      }),
      /enquiries_email_lowercase/,
    );

    await expectRejected(
      prisma.enquiry.create({
        data: {
          ...base,
          id: uuidv7(),
          reference: 'ENQ-9999-00002',
          email: 'asha@example.com',
          message: 'too short',
        },
      }),
      /enquiries_message_length/,
    );
  });

  it('accepts a well-formed enquiry', async () => {
    const enquiry = await prisma.enquiry.create({
      data: {
        id: uuidv7(),
        reference: 'ENQ-9999-00003',
        type: 'CONTACT',
        name: 'Asha',
        email: 'asha@example.com',
        message: 'I would like to know when visits are possible, please.',
        consentGivenAt: new Date(),
        consentVersion: '2026-11-01',
      },
      select: { status: true },
    });

    expect(enquiry.status).toBe('NEW');
  });
});

describe('media metadata rules', () => {
  const baseMedia = {
    originalFilename: 'photo.jpg',
    mimeType: 'image/jpeg',
    kind: 'IMAGE' as const,
  };

  it('refuses a non-positive size and a malformed checksum', async () => {
    await expectRejected(
      prisma.media.create({
        data: {
          ...baseMedia,
          id: uuidv7(),
          storageKey: `2026/11/${PREFIX}-a.jpg`,
          sizeBytes: 0n,
          checksumSha256: 'a'.repeat(64),
        },
      }),
      /media_size_positive/,
    );

    await expectRejected(
      prisma.media.create({
        data: {
          ...baseMedia,
          id: uuidv7(),
          storageKey: `2026/11/${PREFIX}-b.jpg`,
          sizeBytes: 1024n,
          checksumSha256: 'not-a-checksum',
        },
      }),
      /media_checksum_format/,
    );
  });

  it('refuses a storage key containing a traversal sequence', async () => {
    await expectRejected(
      prisma.media.create({
        data: {
          ...baseMedia,
          id: uuidv7(),
          storageKey: `2026/../${PREFIX}-c.jpg`,
          sizeBytes: 1024n,
          checksumSha256: 'b'.repeat(64),
        },
      }),
      /media_storage_key_format/,
    );
  });

  it('accepts valid media metadata', async () => {
    const media = await prisma.media.create({
      data: {
        ...baseMedia,
        id: uuidv7(),
        storageKey: `2026/11/${PREFIX}-ok.jpg`,
        sizeBytes: 2048n,
        checksumSha256: 'c'.repeat(64),
      },
      select: { status: true },
    });

    expect(media.status).toBe('PROCESSING');
  });
});

describe('revisions', () => {
  it('allows only one PUBLISHED revision per entity', async () => {
    const entityId = uuidv7();
    const revisionId = uuidv7();
    revisionIds.push(revisionId);

    await prisma.revision.create({
      data: {
        id: revisionId,
        entityType: 'PAGE',
        entityId,
        version: 1,
        status: 'PUBLISHED',
        snapshot: { title: 'v1' },
        publishedAt: new Date(),
      },
    });

    await expectUniqueViolation(
      prisma.revision.create({
        data: {
          id: uuidv7(),
          entityType: 'PAGE',
          entityId,
          version: 2,
          status: 'PUBLISHED',
          snapshot: { title: 'v2' },
          publishedAt: new Date(),
        },
      }),
    );
  });

  it('refuses to rewrite a snapshot', async () => {
    const revision = await prisma.revision.create({
      data: {
        id: uuidv7(),
        entityType: 'PAGE',
        entityId: uuidv7(),
        version: 1,
        status: 'DRAFT',
        snapshot: { title: 'original' },
      },
      select: { id: true },
    });
    revisionIds.push(revision.id);

    await expectRejected(
      prisma.revision.update({
        where: { id: revision.id },
        data: { snapshot: { title: 'tampered' } },
      }),
      /snapshot is immutable/i,
    );
  });
});

describe('referential integrity', () => {
  it('cascades sections when a page is deleted', async () => {
    const page = await prisma.page.create({
      data: { id: uuidv7(), slug: `${PREFIX}-with-sections`, title: 'Sections' },
      select: { id: true },
    });

    await prisma.pageSection.create({
      data: { id: uuidv7(), pageId: page.id, type: 'hero', sortOrder: 0 },
    });

    await prisma.page.delete({ where: { id: page.id } });

    const remaining = await prisma.pageSection.count({ where: { pageId: page.id } });

    expect(remaining).toBe(0);
  });

  it('refuses two sections at the same position', async () => {
    const page = await prisma.page.create({
      data: { id: uuidv7(), slug: `${PREFIX}-order`, title: 'Order' },
      select: { id: true },
    });

    await prisma.pageSection.create({
      data: { id: uuidv7(), pageId: page.id, type: 'hero', sortOrder: 1 },
    });

    await expectRejected(
      prisma.pageSection.create({
        data: { id: uuidv7(), pageId: page.id, type: 'impact', sortOrder: 1 },
      }),
      /page_sections_page_id_sort_order_key/,
    );
  });

  it('refuses a section body that is not a JSON object', async () => {
    const page = await prisma.page.create({
      data: { id: uuidv7(), slug: `${PREFIX}-json`, title: 'Json' },
      select: { id: true },
    });

    await expectRejected(
      prisma.pageSection.create({
        data: {
          id: uuidv7(),
          pageId: page.id,
          type: 'hero',
          sortOrder: 0,
          content: [1, 2, 3],
        },
      }),
      /page_sections_content_is_object/,
    );
  });
});
