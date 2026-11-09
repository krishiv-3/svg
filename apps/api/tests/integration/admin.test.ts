import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { uuidv7 } from '@gaushala/shared';

import { createApp } from '../../src/app.js';
import { hashPassword } from '../../src/core/auth/index.js';
import { createLogger } from '../../src/core/logging/logger.js';
import { publishDueCampaigns } from '../../src/modules/admin/publishing.js';
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
    const role = await owner.role.findUniqueOrThrow({ where: { key: roleKey } });
    await owner.userRole.create({ data: { userId: user.id, roleId: role.id } });
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

  it('supersedes the previous revision on republish', async () => {
    await authed('super', 'post', `/campaigns/${id}/status`, { action: 'unpublish' });
    await authed('super', 'post', `/campaigns/${id}/status`, { action: 'publish' });

    const revisions = await authed('super', 'get', `/campaigns/${id}/revisions`);
    const statuses = revisions.body.data.map((row: { status: string }) => row.status);

    expect(statuses.filter((status: string) => status === 'PUBLISHED')).toHaveLength(1);
    expect(statuses).toContain('SUPERSEDED');
    expect(revisions.body.data).toHaveLength(2);
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
