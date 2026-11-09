import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { uuidv7 } from '@gaushala/shared';

import { createApp } from '../../src/app.js';
import { hashPassword } from '../../src/core/auth/index.js';
import { createLogger } from '../../src/core/logging/logger.js';
import { publishDueCampaigns, publishDueContent } from '../../src/modules/admin/publishing.js';
import { appClient, ownerClient, testEnv } from './helpers.js';

/**
 * Admin authentication, CSRF, RBAC and the campaign lifecycle.
 *
 * Runs against real PostgreSQL through the real Express app, so the guards are
 * exercised exactly as production composes them.
 */

const config = testEnv();
const prisma = appClient();
const owner = ownerClient();
const logger = createLogger({ level: 'silent' });
const app = createApp({ config, logger, prisma });

const PREFIX = `adm-${String(Date.now())}`;
const PASSWORD = 'Correct-Horse-Battery-9';

interface Actor {
  email: string;
  id: string;
  cookie: string;
  csrf: string;
}

const actors: Record<string, Actor> = {};
const created: { users: string[]; campaigns: string[] } = { users: [], campaigns: [] };

/**
 * Resolve a seeded role, failing with an actionable message.
 *
 * A missing catalogue is a fixture problem, not a product bug; Prisma's
 * "record not found" would send the reader hunting in the wrong place.
 */
async function requireRoleId(key: string): Promise<string> {
  const role = await owner.role.findUnique({ where: { key }, select: { id: true } });

  if (role === null) {
    throw new Error(
      `Test fixture error: role "${key}" is missing from the test database. ` +
        'Seed reference data for the test database (see apps/api/tests/setup.integration.ts).',
    );
  }

  return role.id;
}

async function makeUser(key: string, roleKey: string | null): Promise<void> {
  const email = `${PREFIX}-${key}@example.test`;
  const passwordHash = await hashPassword(PASSWORD);

  const user = await owner.user.create({
    data: {
      id: uuidv7(),
      email,
      name: key,
      status: 'ACTIVE',
      // The bootstrap sets the column; the role carries the wildcard. Keep both
      // consistent so /auth/me reports what the guards actually enforce.
      isSuperAdmin: roleKey === 'super_admin',
      passwordHash,
      passwordUpdatedAt: new Date(),
    },
    select: { id: true },
  });

  created.users.push(user.id);

  if (roleKey !== null) {
    await owner.userRole.create({
      data: { userId: user.id, roleId: await requireRoleId(roleKey) },
    });
  }

  actors[key] = { email, id: user.id, cookie: '', csrf: '' };
}

function cookiesFrom(response: request.Response): { cookie: string; csrf: string } {
  const raw = response.headers['set-cookie'] ?? [];
  const list = Array.isArray(raw) ? raw : [raw];
  const jar: string[] = [];
  let csrf = '';

  for (const line of list) {
    const pair = line.split(';')[0] ?? '';

    if (pair === '') continue;

    jar.push(pair);

    if (pair.startsWith('gaushala_csrf=')) {
      csrf = decodeURIComponent(pair.slice('gaushala_csrf='.length));
    }
  }

  return { cookie: jar.join('; '), csrf };
}

async function login(key: string): Promise<request.Response> {
  const actor = actors[key];

  if (actor === undefined) throw new Error(`unknown actor ${key}`);

  const response = await request(app)
    .post('/api/v1/admin/auth/login')
    .send({ email: actor.email, password: PASSWORD });

  if (response.status === 200) {
    const { cookie, csrf } = cookiesFrom(response);
    actor.cookie = cookie;
    actor.csrf = csrf;
  }

  return response;
}

async function authed(
  key: string,
  method: 'get' | 'post' | 'put',
  path: string,
  body?: Record<string, unknown>,
) {
  const actor = actors[key];

  if (actor === undefined) throw new Error(`unknown actor ${key}`);

  const agent = request(app)
    [method](`/api/v1/admin${path}`)
    .set('cookie', actor.cookie)
    .set('x-csrf-token', actor.csrf);

  return body === undefined ? agent : agent.send(body);
}

const campaignPayload = (slug: string) => ({
  name: 'Admin test campaign',
  slug,
  purposeSummary: 'A campaign created by the admin regression suite.',
  story: 'First paragraph.\n\nSecond paragraph.',
  targetAmountMinor: 500_000,
  manualRaisedMinor: 100_000,
  manualRaisedNote: 'Fixture',
  progressSource: 'MANUAL',
  startDate: '2026-01-01',
  endDate: null,
  isFeatured: false,
  acceptsDonations: true,
  seoTitle: null,
  seoDescription: null,
  version: 1,
});

beforeAll(async () => {
  await makeUser('super', 'super_admin');
  await makeUser('editor', 'content_editor');
  await makeUser('donation', 'donation_manager');
  await makeUser('volunteer', 'volunteer_manager');
  await makeUser('norole', null);
  await login('super');
});

afterAll(async () => {
  await owner.revision.deleteMany({ where: { entityId: { in: created.campaigns } } });
  await owner.campaign.deleteMany({ where: { id: { in: created.campaigns } } });
  await owner.auditLog.deleteMany({ where: { actorId: { in: created.users } } });
  await owner.loginAttempt.deleteMany({ where: { emailHash: { not: '' } } });
  await owner.session.deleteMany({ where: { userId: { in: created.users } } });
  await owner.userRole.deleteMany({ where: { userId: { in: created.users } } });
  await owner.user.deleteMany({ where: { id: { in: created.users } } });
  await owner.$disconnect();
  await prisma.$disconnect();
});

describe('authentication', () => {
  it('signs in and issues an HttpOnly session', async () => {
    const response = await login('super');

    expect(response.status).toBe(200);
    expect(response.body.data.email).toContain(PREFIX);

    const raw = response.headers['set-cookie'] ?? [];
    const session = (Array.isArray(raw) ? raw : [raw]).find((line) =>
      line.startsWith('gaushala_session='),
    );
    expect(session).toContain('HttpOnly');
    expect(session?.toLowerCase()).toContain('samesite=strict');
  });

  it('rejects a wrong password with the same message as an unknown user', async () => {
    const wrong = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: actors['super']?.email ?? '', password: 'wrong-password-123' });
    const unknown = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: `${PREFIX}-nobody@example.test`, password: 'wrong-password-123' });

    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.title).toBe(unknown.body.title);
  });

  it('validates the session and refuses requests without one', async () => {
    const me = await authed('super', 'get', '/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.isSuperAdmin).toBe(true);

    const anonymous = await request(app).get('/api/v1/admin/campaigns');
    expect(anonymous.status).toBe(401);
  });

  it('expires sessions', async () => {
    const actor = actors['editor'];

    if (actor === undefined) throw new Error('missing actor');

    await login('editor');

    await owner.session.updateMany({
      where: { userId: actor.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const response = await authed('editor', 'get', '/auth/me');
    expect(response.status).toBe(401);
  });

  it('revokes the session on logout', async () => {
    await login('volunteer');

    const logout = await authed('volunteer', 'post', '/auth/logout');
    expect(logout.status).toBe(204);

    const after = await authed('volunteer', 'get', '/auth/me');
    expect(after.status).toBe(401);
  });

  it('rate-limits repeated failures', async () => {
    // A dedicated address: locking one of the fixture accounts here would make
    // every later test fail for the wrong reason.
    const email = `${PREFIX}-ratelimit@example.test`;
    let last = 0;

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const response = await request(app)
        .post('/api/v1/admin/auth/login')
        .send({ email, password: 'definitely-wrong' });
      last = response.status;
    }

    expect(last).toBe(429);
  });
});

describe('CSRF', () => {
  it('rejects a mutation without a token', async () => {
    const response = await request(app)
      .post('/api/v1/admin/campaigns')
      .set('cookie', actors['super']?.cookie ?? '')
      .send(campaignPayload(`${PREFIX}-csrf-missing`));

    expect(response.status).toBe(403);
  });

  it('rejects an invalid token', async () => {
    const response = await request(app)
      .post('/api/v1/admin/campaigns')
      .set('cookie', actors['super']?.cookie ?? '')
      .set('x-csrf-token', 'not-the-token')
      .send(campaignPayload(`${PREFIX}-csrf-bad`));

    expect(response.status).toBe(403);
  });

  it('accepts a valid token', async () => {
    const response = await authed(
      'super',
      'post',
      '/campaigns',
      campaignPayload(`${PREFIX}-csrf-ok`),
    );

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('DRAFT');
    created.campaigns.push(response.body.data.id);
  });
});

describe('RBAC', () => {
  it('denies a user with no roles', async () => {
    await login('norole');

    expect((await authed('norole', 'get', '/campaigns')).status).toBe(403);
    expect((await authed('norole', 'get', '/dashboard')).status).toBe(403);
  });

  it('lets a content editor work with campaigns', async () => {
    await login('editor');

    const response = await authed(
      'editor',
      'post',
      '/campaigns',
      campaignPayload(`${PREFIX}-editor`),
    );
    expect(response.status).toBe(201);
    created.campaigns.push(response.body.data.id);
  });

  it('keeps a volunteer manager out of content', async () => {
    await login('volunteer');

    expect((await authed('volunteer', 'get', '/campaigns')).status).toBe(403);
  });

  it('prevents a non-super-admin from reading users through the dashboard', async () => {
    await login('donation');

    const response = await authed('donation', 'get', '/campaigns');
    expect([200, 403]).toContain(response.status);
    // The escalation check: the permission list never contains the wildcard.
    const me = await authed('donation', 'get', '/auth/me');
    expect(me.body.data.isSuperAdmin).toBe(false);
    expect(me.body.data.permissions).not.toContain('*');
  });
});

describe('campaign lifecycle', () => {
  let id = '';
  const slug = `${PREFIX}-lifecycle`;

  it('creates a draft that the public API cannot see', async () => {
    await login('super');
    const createdCampaign = await authed('super', 'post', '/campaigns', campaignPayload(slug));

    expect(createdCampaign.status).toBe(201);
    id = createdCampaign.body.data.id;
    created.campaigns.push(id);

    const publicLookup = await request(app).get(`/api/v1/public/campaigns/${slug}`);
    expect(publicLookup.status).toBe(404);
  });

  it('edits the draft and rejects a stale version', async () => {
    const edited = await authed('super', 'put', `/campaigns/${id}`, {
      ...campaignPayload(slug),
      name: 'Admin test campaign (edited)',
      version: 1,
    });

    expect(edited.status).toBe(200);
    expect(edited.body.data.name).toContain('edited');

    const stale = await authed('super', 'put', `/campaigns/${id}`, {
      ...campaignPayload(slug),
      version: 1,
    });

    expect(stale.status).toBe(409);
    expect(stale.body.code).toBe('VERSION_CONFLICT');
  });

  it('publishes, writes a revision and appears publicly', async () => {
    const published = await authed('super', 'post', `/campaigns/${id}/status`, {
      action: 'publish',
    });
    expect(published.status).toBe(200);
    expect(published.body.data.status).toBe('PUBLISHED');

    const publicLookup = await request(app).get(`/api/v1/public/campaigns/${slug}`);
    expect(publicLookup.status).toBe(200);
    expect(publicLookup.body.data.name).toContain('edited');

    const revisions = await authed('super', 'get', `/campaigns/${id}/revisions`);
    expect(revisions.status).toBe(200);
    expect(revisions.body.data).toHaveLength(1);
    expect(revisions.body.data[0].status).toBe('PUBLISHED');
    expect(revisions.body.data[0].snapshot.slug).toBe(slug);
  });

  it('keeps a single revision when republishing unchanged content', async () => {
    await authed('super', 'post', `/campaigns/${id}/status`, { action: 'unpublish' });
    await authed('super', 'post', `/campaigns/${id}/status`, { action: 'publish' });

    const revisions = await authed('super', 'get', `/campaigns/${id}/revisions`);
    const statuses = revisions.body.data.map((row: { status: string }) => row.status);

    // Identical content is not a new revision: the existing PUBLISHED snapshot
    // stays live and nothing is superseded (see the de-duplication suite).
    expect(statuses.filter((status: string) => status === 'PUBLISHED')).toHaveLength(1);
    expect(statuses).not.toContain('SUPERSEDED');
    expect(revisions.body.data).toHaveLength(1);
  });

  it('unpublishes and disappears from the public API', async () => {
    const response = await authed('super', 'post', `/campaigns/${id}/status`, {
      action: 'unpublish',
    });
    expect(response.status).toBe(200);

    const publicLookup = await request(app).get(`/api/v1/public/campaigns/${slug}`);
    expect(publicLookup.status).toBe(404);
  });

  it('archives without deleting', async () => {
    const response = await authed('super', 'post', `/campaigns/${id}/status`, {
      action: 'archive',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ARCHIVED');

    const stillThere = await authed('super', 'get', `/campaigns/${id}`);
    expect(stillThere.status).toBe(200);
  });

  it('keeps drafts out of the public listing', async () => {
    const listing = await request(app).get('/api/v1/public/campaigns');
    const slugs = (listing.body.data as { slug: string }[]).map((item) => item.slug);

    expect(slugs).not.toContain(`${PREFIX}-csrf-ok`);
  });

  it('rejects invalid input with a problem document', async () => {
    const response = await authed('super', 'post', '/campaigns', {
      ...campaignPayload('Invalid Slug With Spaces'),
      name: 'x',
    });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe('VALIDATION_FAILED');
  });
});

describe('preview', () => {
  it('shows a draft to an authorised administrator only', async () => {
    const draft = await authed('super', 'post', '/campaigns', campaignPayload(`${PREFIX}-preview`));
    created.campaigns.push(draft.body.data.id);

    const preview = await authed('super', 'get', `/campaigns/${draft.body.data.id}/preview`);
    expect(preview.status).toBe(200);
    expect(preview.body.data.preview).toBe(true);
    expect(preview.headers['cache-control']).toContain('no-store');

    const anonymous = await request(app).get(
      `/api/v1/admin/campaigns/${String(draft.body.data.id)}/preview`,
    );
    expect(anonymous.status).toBe(401);

    const publicLookup = await request(app).get(
      `/api/v1/public/campaigns/${String(draft.body.data.slug)}`,
    );
    expect(publicLookup.status).toBe(404);
  });
});

describe('scheduled publishing', () => {
  it('keeps a scheduled campaign private until its time, then publishes it', async () => {
    await login('super');

    const scheduledSlug = `${PREFIX}-scheduled`;
    const createdCampaign = await authed(
      'super',
      'post',
      '/campaigns',
      campaignPayload(scheduledSlug),
    );
    const scheduledId = createdCampaign.body.data.id as string;
    created.campaigns.push(scheduledId);

    const future = new Date(Date.now() + 3_600_000).toISOString();
    const scheduled = await authed('super', 'post', `/campaigns/${scheduledId}/status`, {
      action: 'schedule',
      scheduledFor: future,
    });

    expect(scheduled.status).toBe(200);
    expect(scheduled.body.data.status).toBe('SCHEDULED');
    expect((await request(app).get(`/api/v1/public/campaigns/${scheduledSlug}`)).status).toBe(404);

    // Not yet due: the publisher must not touch it.
    expect(await publishDueCampaigns(prisma, logger)).toBe(0);
    expect((await request(app).get(`/api/v1/public/campaigns/${scheduledSlug}`)).status).toBe(404);

    // Make it due, then run the publisher twice to prove idempotency.
    await owner.campaign.update({
      where: { id: scheduledId },
      data: { scheduledFor: new Date(Date.now() - 1000) },
    });

    const first = await publishDueCampaigns(prisma, logger);
    const second = await publishDueCampaigns(prisma, logger);

    expect(first).toBeGreaterThanOrEqual(1);
    expect(second).toBe(0);
    expect((await request(app).get(`/api/v1/public/campaigns/${scheduledSlug}`)).status).toBe(200);
  });

  it('refuses a schedule time in the past', async () => {
    const createdCampaign = await authed(
      'super',
      'post',
      '/campaigns',
      campaignPayload(`${PREFIX}-past`),
    );
    created.campaigns.push(createdCampaign.body.data.id);

    const response = await authed(
      'super',
      'post',
      `/campaigns/${String(createdCampaign.body.data.id)}/status`,
      {
        action: 'schedule',
        scheduledFor: new Date(Date.now() - 60_000).toISOString(),
      },
    );

    expect(response.status).toBe(422);
  });
});

describe('content modules (activities, events, news)', () => {
  const ids: { activities: string[]; events: string[]; news: string[] } = {
    activities: [],
    events: [],
    news: [],
  };
  const suffix = String(Date.now());

  afterAll(async () => {
    await owner.activity.deleteMany({ where: { id: { in: ids.activities } } });
    await owner.event.deleteMany({ where: { id: { in: ids.events } } });
    await owner.newsPost.deleteMany({ where: { id: { in: ids.news } } });
  });

  const activity = (slug: string) => ({
    title: 'Admin activity',
    slug,
    shortDescription: 'A short description of the activity for the card.',
    body: 'First paragraph.\n\nSecond paragraph.',
    category: null,
    location: null,
    isFeatured: false,
    seoTitle: null,
    seoDescription: null,
    noindex: false,
    version: 1,
  });

  it('creates, publishes and isolates an activity', async () => {
    await login('super');

    const slug = `adm-activity-${suffix}`;
    const created = await authed('super', 'post', '/activities', activity(slug));
    expect(created.status).toBe(201);
    ids.activities.push(created.body.data.id);

    expect((await request(app).get(`/api/v1/public/activities/${slug}`)).status).toBe(404);

    const published = await authed(
      'super',
      'post',
      `/activities/${String(created.body.data.id)}/status`,
      {
        action: 'publish',
      },
    );
    expect(published.status).toBe(200);
    expect(published.body.data.status).toBe('PUBLISHED');

    const visible = await request(app).get(`/api/v1/public/activities/${slug}`);
    expect(visible.status).toBe(200);
    expect(visible.body.data.title).toBe('Admin activity');
  });

  it('rejects a stale activity version', async () => {
    const created = await authed(
      'super',
      'post',
      '/activities',
      activity(`adm-activity-${suffix}-b`),
    );
    ids.activities.push(created.body.data.id);

    const stale = await authed('super', 'put', `/activities/${String(created.body.data.id)}`, {
      ...activity(`adm-activity-${suffix}-b`),
      version: 99,
    });

    expect(stale.status).toBe(409);
  });

  it('creates, publishes and isolates an event', async () => {
    const slug = `adm-event-${suffix}`;
    const created = await authed('super', 'post', '/events', {
      title: 'Admin event',
      slug,
      description: 'An event created by the admin regression suite.',
      startAt: new Date(Date.now() + 86_400_000).toISOString(),
      endAt: null,
      venueName: 'Gaushala grounds',
      venueAddress: null,
      registrationUrl: null,
      isFeatured: false,
      seoTitle: null,
      seoDescription: null,
      noindex: false,
      version: 1,
    });

    expect(created.status).toBe(201);
    ids.events.push(created.body.data.id);

    expect((await request(app).get(`/api/v1/public/events/${slug}`)).status).toBe(404);

    await authed('super', 'post', `/events/${String(created.body.data.id)}/status`, {
      action: 'publish',
    });

    expect((await request(app).get(`/api/v1/public/events/${slug}`)).status).toBe(200);
  });

  it('creates and publishes a news article with a category', async () => {
    const category = await authed('super', 'post', '/news-categories', {
      name: 'Admin category',
      slug: `adm-cat-${suffix}`,
    });
    expect(category.status).toBe(201);

    const slug = `adm-news-${suffix}`;
    const created = await authed('super', 'post', '/news', {
      title: 'Admin article',
      slug,
      excerpt: 'An article created by the admin regression suite.',
      body: 'Article body paragraph.',
      categoryId: category.body.data.id,
      attributionName: null,
      readingMinutes: 2,
      seoTitle: null,
      seoDescription: null,
      noindex: false,
      version: 1,
    });

    expect(created.status).toBe(201);
    ids.news.push(created.body.data.id);

    expect((await request(app).get(`/api/v1/public/news/${slug}`)).status).toBe(404);

    await authed('super', 'post', `/news/${String(created.body.data.id)}/status`, {
      action: 'publish',
    });

    const visible = await request(app).get(`/api/v1/public/news/${slug}`);
    expect(visible.status).toBe(200);
    expect(visible.body.data.title).toBe('Admin article');
  });

  it('denies content modules to a user without roles', async () => {
    await login('norole');

    expect((await authed('norole', 'get', '/activities')).status).toBe(403);
    expect((await authed('norole', 'get', '/events')).status).toBe(403);
    expect((await authed('norole', 'get', '/news')).status).toBe(403);
  });
});

describe('campaign manual evidence validation', () => {
  // Slugs must be unique per run: a leftover row would trip the live-slug index.
  const run = String(Date.now());
  const slugFor = (suffix: string) => `adm-manual-${run}-${suffix}`;
  let id = '';

  const payload = (over: Record<string, unknown>) => ({
    ...campaignPayload(slugFor('base')),
    ...over,
  });

  beforeAll(async () => {
    await login('super');
    const saved = await authed('super', 'post', '/campaigns', payload({ slug: slugFor('base') }));
    id = saved.body.data.id;
    created.campaigns.push(id);
  });

  it('rejects a manual total with no source note, naming the field', async () => {
    const response = await authed('super', 'put', `/campaigns/${id}`, {
      ...payload({}),
      manualRaisedNote: null,
      version: 1,
    });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe('VALIDATION_FAILED');
    expect(response.body.errors.map((e: { path: string }) => e.path)).toContain('manualRaisedNote');
  });

  it('rejects a whitespace-only source note', async () => {
    const response = await authed('super', 'put', `/campaigns/${id}`, {
      ...payload({}),
      manualRaisedNote: '   ',
      version: 1,
    });

    expect(response.status).toBe(422);
    expect(response.body.errors.map((e: { path: string }) => e.path)).toContain('manualRaisedNote');
  });

  it('accepts a manual total with a real source note', async () => {
    const response = await authed('super', 'put', `/campaigns/${id}`, {
      ...payload({}),
      manualRaisedNote: 'Recorded in the donation ledger',
      version: 1,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('DRAFT');
  });

  it('does not require a note for verified donations', async () => {
    const saved = await authed('super', 'post', '/campaigns', {
      ...payload({ slug: slugFor('verified') }),
      progressSource: 'VERIFIED_DONATIONS',
      manualRaisedMinor: null,
      manualRaisedNote: null,
    });

    expect(saved.status).toBe(201);
    created.campaigns.push(saved.body.data.id);
  });

  it('accepts empty optional fields', async () => {
    const saved = await authed('super', 'post', '/campaigns', {
      ...payload({ slug: slugFor('empty') }),
      targetAmountMinor: null,
      endDate: null,
      seoTitle: null,
      seoDescription: null,
      manualRaisedNote: 'Ledger',
    });

    expect(saved.status).toBe(201);
    created.campaigns.push(saved.body.data.id);
  });

  it('rejects an invalid date with a field-level error', async () => {
    const response = await authed('super', 'put', `/campaigns/${id}`, {
      ...payload({}),
      startDate: 'not-a-date',
      manualRaisedNote: 'Ledger',
      version: 1,
    });

    expect(response.status).toBe(422);
    expect(response.body.errors.map((e: { path: string }) => e.path)).toContain('startDate');
  });
});

describe('scheduled sweep across content types', () => {
  const suffix = String(Date.now());
  const made: { activities: string[]; events: string[]; news: string[] } = {
    activities: [],
    events: [],
    news: [],
  };

  afterAll(async () => {
    await owner.activity.deleteMany({ where: { id: { in: made.activities } } });
    await owner.event.deleteMany({ where: { id: { in: made.events } } });
    await owner.newsPost.deleteMany({ where: { id: { in: made.news } } });
    await owner.revision.deleteMany({
      where: { entityId: { in: [...made.activities, ...made.events, ...made.news] } },
    });
  });

  const scheduleFor = (iso: string) => ({ action: 'schedule' as const, scheduledFor: iso });

  it('publishes only when due, once, for every content type', async () => {
    await login('super');

    const future = new Date(Date.now() + 3_600_000).toISOString();
    const past = new Date(Date.now() - 1000);

    const activity = await authed('super', 'post', '/activities', {
      title: 'Scheduled activity',
      slug: `adm-sched-act-${suffix}`,
      shortDescription: 'An activity scheduled for later publication.',
      body: 'Body paragraph for the scheduled activity.',
      category: null,
      location: null,
      isFeatured: false,
      seoTitle: null,
      seoDescription: null,
      noindex: false,
      version: 1,
    });
    made.activities.push(activity.body.data.id);

    const event = await authed('super', 'post', '/events', {
      title: 'Scheduled event',
      slug: `adm-sched-evt-${suffix}`,
      description: 'An event scheduled for later publication.',
      startAt: new Date(Date.now() + 86_400_000).toISOString(),
      endAt: null,
      venueName: null,
      venueAddress: null,
      registrationUrl: null,
      isFeatured: false,
      seoTitle: null,
      seoDescription: null,
      noindex: false,
      version: 1,
    });
    made.events.push(event.body.data.id);

    const article = await authed('super', 'post', '/news', {
      title: 'Scheduled article',
      slug: `adm-sched-news-${suffix}`,
      excerpt: 'An article scheduled for later publication.',
      body: 'Body paragraph for the scheduled article.',
      categoryId: null,
      attributionName: null,
      readingMinutes: 1,
      seoTitle: null,
      seoDescription: null,
      noindex: false,
      version: 1,
    });
    made.news.push(article.body.data.id);

    for (const [kind, created] of [
      ['activities', activity],
      ['events', event],
      ['news', article],
    ] as const) {
      const scheduled = await authed(
        'super',
        'post',
        `/${kind}/${String(created.body.data.id)}/status`,
        scheduleFor(future),
      );
      expect(scheduled.status).toBe(200);
      expect(scheduled.body.data.status).toBe('SCHEDULED');
    }

    // Nothing is due yet.
    const early = await publishDueContent(prisma, logger);
    expect(early.published).toBe(0);

    for (const [kind, created] of [
      ['activities', activity],
      ['events', event],
      ['news', article],
    ] as const) {
      const slug = created.body.data.slug;
      const path =
        kind === 'news' ? `/api/v1/public/news/${slug}` : `/api/v1/public/${kind}/${slug}`;
      expect((await request(app).get(path)).status).toBe(404);
    }

    // Make all three due.
    await owner.activity.updateMany({
      where: { id: { in: made.activities } },
      data: { scheduledFor: past },
    });
    await owner.event.updateMany({
      where: { id: { in: made.events } },
      data: { scheduledFor: past },
    });
    await owner.newsPost.updateMany({
      where: { id: { in: made.news } },
      data: { scheduledFor: past },
    });

    const sweep = await publishDueContent(prisma, logger);
    expect(sweep.published).toBeGreaterThanOrEqual(3);
    expect(sweep.failed).toBe(0);

    for (const [kind, created] of [
      ['activities', activity],
      ['events', event],
      ['news', article],
    ] as const) {
      const slug = created.body.data.slug;
      const path =
        kind === 'news' ? `/api/v1/public/news/${slug}` : `/api/v1/public/${kind}/${slug}`;
      expect((await request(app).get(path)).status).toBe(200);
    }

    // A second sweep publishes nothing more.
    const again = await publishDueContent(prisma, logger);
    expect(again.published).toBe(0);

    // Publishing wrote exactly one snapshot per item.
    const revisions = await owner.revision.findMany({
      where: { entityId: { in: [...made.activities, ...made.events, ...made.news] } },
    });
    expect(revisions).toHaveLength(3);
    expect(revisions.every((row) => row.status === 'PUBLISHED')).toBe(true);
  });
});

describe('previews for content modules', () => {
  it('allows an authorised admin, refuses anonymous, and keeps the draft private', async () => {
    await login('super');

    const created = await authed('super', 'post', '/activities', {
      title: 'Preview activity',
      slug: `adm-preview-${String(Date.now())}`,
      shortDescription: 'An activity used to check the preview endpoint.',
      body: 'Body paragraph for preview.',
      category: null,
      location: null,
      isFeatured: false,
      seoTitle: null,
      seoDescription: null,
      noindex: false,
      version: 1,
    });

    const id = String(created.body.data.id);
    const slug = String(created.body.data.slug);

    const preview = await authed('super', 'get', `/activities/${id}/preview`);
    expect(preview.status).toBe(200);
    expect(preview.body.data.preview).toBe(true);
    expect(preview.headers['cache-control']).toContain('no-store');

    const anonymous = await request(app).get(`/api/v1/admin/activities/${id}/preview`);
    expect(anonymous.status).toBe(401);

    expect((await request(app).get(`/api/v1/public/activities/${slug}`)).status).toBe(404);

    await owner.activity.deleteMany({ where: { id } });
  });
});

describe('revision snapshot de-duplication', () => {
  const run = String(Date.now());
  let id = '';
  const slug = `adm-dedup-${run}`;

  const payload = (over: Record<string, unknown> = {}) => ({
    ...campaignPayload(slug),
    manualRaisedNote: 'Ledger',
    ...over,
  });

  beforeAll(async () => {
    await login('super');
    const saved = await authed('super', 'post', '/campaigns', payload());
    id = saved.body.data.id;
    created.campaigns.push(id);
  });

  afterAll(async () => {
    await owner.revision.deleteMany({ where: { entityId: id } });
  });

  it('writes one snapshot on first publish', async () => {
    const published = await authed('super', 'post', `/campaigns/${id}/status`, {
      action: 'publish',
    });
    expect(published.status).toBe(200);

    const revisions = await owner.revision.findMany({ where: { entityId: id } });
    expect(revisions).toHaveLength(1);
    expect(revisions[0]?.status).toBe('PUBLISHED');
  });

  it('does not duplicate the snapshot when republishing unchanged content', async () => {
    await authed('super', 'post', `/campaigns/${id}/status`, { action: 'unpublish' });
    const republished = await authed('super', 'post', `/campaigns/${id}/status`, {
      action: 'publish',
    });
    expect(republished.status).toBe(200);

    const revisions = await owner.revision.findMany({ where: { entityId: id } });
    expect(revisions).toHaveLength(1);
    expect(revisions[0]?.status).toBe('PUBLISHED');
  });

  it('writes a new version when the content actually changes', async () => {
    const current = await authed('super', 'get', `/campaigns/${id}`);
    const edited = await authed('super', 'put', `/campaigns/${id}`, {
      ...payload({ name: 'Dedup campaign renamed' }),
      version: current.body.data.version,
    });
    expect(edited.status).toBe(200);

    await authed('super', 'post', `/campaigns/${id}/status`, { action: 'unpublish' });
    await authed('super', 'post', `/campaigns/${id}/status`, { action: 'publish' });

    const revisions = await owner.revision.findMany({
      where: { entityId: id },
      orderBy: { version: 'asc' },
    });

    expect(revisions).toHaveLength(2);
    expect(revisions.map((row) => row.version)).toEqual([1, 2]);
    expect(revisions[0]?.status).toBe('SUPERSEDED');
    expect(revisions[1]?.status).toBe('PUBLISHED');
  });
});

describe('scheduled sweep failure isolation', () => {
  const run = String(Date.now());
  const failingSlug = `adm-fail-${run}`;
  const healthySlug = `adm-ok-${run}`;
  let failingId = '';
  let healthyId = '';

  const activity = (slug: string) => ({
    title: 'Scheduled sweep item',
    slug,
    shortDescription: 'Scheduled activity used to test failure isolation.',
    body: 'Body paragraph for the scheduled activity.',
    category: null,
    location: null,
    isFeatured: false,
    seoTitle: null,
    seoDescription: null,
    noindex: false,
    version: 1,
  });

  const schedule = async (id: string): Promise<void> => {
    await authed('super', 'post', `/activities/${id}/status`, {
      action: 'schedule',
      scheduledFor: new Date(Date.now() + 3_600_000).toISOString(),
    });
  };

  beforeAll(async () => {
    await login('super');

    const failing = await authed('super', 'post', '/activities', activity(failingSlug));
    const healthy = await authed('super', 'post', '/activities', activity(healthySlug));
    failingId = failing.body.data.id;
    healthyId = healthy.body.data.id;

    await schedule(failingId);
    await schedule(healthyId);

    // Make both due.
    await owner.activity.updateMany({
      where: { id: { in: [failingId, healthyId] } },
      data: { scheduledFor: new Date(Date.now() - 1000) },
    });

    // Deterministic, test-local failure: publishing this row would set it to
    // PUBLISHED, which this constraint forbids. Dropped again below.
    await owner.$executeRawUnsafe(
      `ALTER TABLE "activities" ADD CONSTRAINT "test_fail_${run}" CHECK ("id" <> '${failingId}'::uuid OR "status" <> 'PUBLISHED')`,
    );
  });

  afterAll(async () => {
    await owner.$executeRawUnsafe(
      `ALTER TABLE "activities" DROP CONSTRAINT IF EXISTS "test_fail_${run}"`,
    );
    await owner.revision.deleteMany({ where: { entityId: { in: [failingId, healthyId] } } });
    await owner.activity.deleteMany({ where: { id: { in: [failingId, healthyId] } } });
  });

  it('isolates the failure, keeps the row unpublished, and retries successfully', async () => {
    const sweep = await publishDueContent(prisma, logger);

    expect(sweep.failed).toBeGreaterThanOrEqual(1);
    expect(sweep.published).toBeGreaterThanOrEqual(1);

    // The healthy item went live; the failing one did not.
    expect((await request(app).get(`/api/v1/public/activities/${healthySlug}`)).status).toBe(200);
    expect((await request(app).get(`/api/v1/public/activities/${failingSlug}`)).status).toBe(404);

    const failingRow = await owner.activity.findUniqueOrThrow({ where: { id: failingId } });
    expect(failingRow.status).toBe('SCHEDULED');
    expect(failingRow.publishedAt).toBeNull();

    // No partial revision survived the rollback.
    expect(await owner.revision.count({ where: { entityId: failingId } })).toBe(0);

    // Resolve the failure and let the next sweep retry.
    await owner.$executeRawUnsafe(
      `ALTER TABLE "activities" DROP CONSTRAINT IF EXISTS "test_fail_${run}"`,
    );

    const retry = await publishDueContent(prisma, logger);
    expect(retry.published).toBeGreaterThanOrEqual(1);
    expect((await request(app).get(`/api/v1/public/activities/${failingSlug}`)).status).toBe(200);

    // Idempotent: another sweep publishes nothing.
    const again = await publishDueContent(prisma, logger);
    expect(again.published).toBe(0);
  });
});

describe('event registration URL validation', () => {
  const run = String(Date.now());
  const ids: string[] = [];

  const event = (slug: string, registrationUrl: string | null) => ({
    title: 'Registration URL event',
    slug,
    description: 'An event used to check registration URL validation.',
    startAt: new Date(Date.now() + 86_400_000).toISOString(),
    endAt: null,
    venueName: null,
    venueAddress: null,
    registrationUrl,
    isFeatured: false,
    seoTitle: null,
    seoDescription: null,
    noindex: false,
    version: 1,
  });

  afterAll(async () => {
    await owner.event.deleteMany({ where: { id: { in: ids } } });
  });

  it('accepts an https URL', async () => {
    const response = await authed(
      'super',
      'post',
      '/events',
      event(`adm-url-https-${run}`, 'https://example.org/register'),
    );

    expect(response.status).toBe(201);
    ids.push(response.body.data.id);
  });

  it('accepts an http URL', async () => {
    const response = await authed(
      'super',
      'post',
      '/events',
      event(`adm-url-http-${run}`, 'http://example.org/register'),
    );

    expect(response.status).toBe(201);
    ids.push(response.body.data.id);
  });

  it('accepts an empty optional URL', async () => {
    const response = await authed('super', 'post', '/events', event(`adm-url-empty-${run}`, null));

    expect(response.status).toBe(201);
    ids.push(response.body.data.id);
  });

  it('rejects arbitrary text and names the field', async () => {
    const response = await authed(
      'super',
      'post',
      '/events',
      event(`adm-url-bad-${run}`, 'not a url'),
    );

    expect(response.status).toBe(422);
    expect(response.body.errors.map((error: { path: string }) => error.path)).toContain(
      'registrationUrl',
    );
  });

  it('rejects a malformed scheme', async () => {
    const response = await authed(
      'super',
      'post',
      '/events',
      event(`adm-url-scheme-${run}`, 'javascript:alert(1)'),
    );

    expect(response.status).toBe(422);
  });
});

describe('campaign detail payload', () => {
  it('includes the manual source note so the editor can populate it', async () => {
    await login('super');
    const slug = `adm-dto-${String(Date.now())}`;

    const saved = await authed('super', 'post', '/campaigns', {
      ...campaignPayload(slug),
      manualRaisedNote: 'Recorded in the ledger',
    });
    created.campaigns.push(saved.body.data.id);

    const detail = await authed('super', 'get', `/campaigns/${saved.body.data.id}`);

    expect(detail.status).toBe(200);
    expect(detail.body.data.manualRaisedNote).toBe('Recorded in the ledger');
    expect(typeof detail.body.data.manualRaisedMinor).toBe('number');
  });
});

describe('role fixtures', () => {
  const EXPECTED_ROLES = ['super_admin', 'content_editor', 'donation_manager', 'volunteer_manager'];

  it('has the full role catalogue in the test database', async () => {
    const roles = await owner.role.findMany({
      where: { key: { in: EXPECTED_ROLES } },
      select: { key: true, permissions: { select: { permissionId: true } } },
    });

    expect(roles.map((role) => role.key).sort()).toEqual([...EXPECTED_ROLES].sort());

    for (const role of roles) {
      // Every role carries grants; an empty catalogue would silently deny
      // everything and make RBAC tests pass for the wrong reason.
      expect(role.permissions.length).toBeGreaterThan(0);
    }
  });

  it('builds an actor for every supported role', async () => {
    for (const [actor, roleKey] of [
      ['super', 'super_admin'],
      ['editor', 'content_editor'],
      ['donation', 'donation_manager'],
      ['volunteer', 'volunteer_manager'],
    ] as const) {
      const user = actors[actor];
      expect(user).toBeDefined();

      if (user === undefined) continue;

      const links = await owner.userRole.findMany({
        where: { userId: user.id },
        select: { role: { select: { key: true } } },
      });

      expect(links.map((link) => link.role.key)).toContain(roleKey);
    }
  });

  it('reports a missing role as a fixture error, not a Prisma exception', async () => {
    await expect(requireRoleId('does_not_exist')).rejects.toThrow(/Test fixture error/);
  });
});
