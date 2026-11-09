import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { uuidv7 } from '@gaushala/shared';

import { createApp } from '../../src/app.js';
import { hashPassword } from '../../src/core/auth/index.js';
import { createLogger } from '../../src/core/logging/logger.js';
import { appClient, ownerClient, testEnv } from './helpers.js';

/**
 * Batch 2: testimonials, impact statistics, enquiries, administrators, settings.
 *
 * Focused on the rules that matter: consent before publication, verification
 * before visibility, enquiry privacy, last-super-admin protection and settings
 * URL validation.
 */

const config = testEnv();
const prisma = appClient();
const owner = ownerClient();
const logger = createLogger({ level: 'silent' });
const app = createApp({ config, logger, prisma });

const PREFIX = `b2-${String(Date.now())}`;
const PASSWORD = 'Correct-Horse-Battery-9';

let superAdmin = { id: '', email: '', cookie: '', csrf: '' };
let editor = { id: '', email: '', cookie: '', csrf: '' };
let noRole = { id: '', email: '', cookie: '', csrf: '' };

const cleanup = {
  users: [] as string[],
  testimonials: [] as string[],
  impact: [] as string[],
  enquiries: [] as string[],
};

function cookiesFrom(response: request.Response): { cookie: string; csrf: string } {
  const raw = response.headers['set-cookie'] ?? [];
  const list = Array.isArray(raw) ? raw : [raw];
  const jar: string[] = [];
  let csrf = '';

  for (const line of list) {
    const pair = line.split(';')[0] ?? '';
    if (pair === '') continue;
    jar.push(pair);
    if (pair.startsWith('gaushala_csrf='))
      csrf = decodeURIComponent(pair.slice('gaushala_csrf='.length));
  }

  return { cookie: jar.join('; '), csrf };
}

async function createUser(
  key: string,
  roleKey: string | null,
): Promise<{ id: string; email: string; cookie: string; csrf: string }> {
  const email = `${PREFIX}-${key}@example.test`;
  const passwordHash = await hashPassword(PASSWORD);

  const user = await owner.user.create({
    data: {
      id: uuidv7(),
      email,
      name: key,
      status: 'ACTIVE',
      isSuperAdmin: roleKey === 'super_admin',
      passwordHash,
      passwordUpdatedAt: new Date(),
    },
    select: { id: true },
  });

  cleanup.users.push(user.id);

  if (roleKey !== null) {
    const role = await owner.role.findUnique({ where: { key: roleKey }, select: { id: true } });
    if (role === null) throw new Error(`Test fixture error: role "${roleKey}" missing`);
    await owner.userRole.create({ data: { userId: user.id, roleId: role.id } });
  }

  const response = await request(app)
    .post('/api/v1/admin/auth/login')
    .send({ email, password: PASSWORD });
  const { cookie, csrf } = cookiesFrom(response);

  return { id: user.id, email, cookie, csrf };
}

async function call(
  who: { cookie: string; csrf: string },
  method: 'get' | 'post' | 'put',
  path: string,
  body?: Record<string, unknown>,
) {
  const agent = request(app)
    [method](`/api/v1/admin${path}`)
    .set('cookie', who.cookie)
    .set('x-csrf-token', who.csrf);

  return body === undefined ? agent : agent.send(body);
}

beforeAll(async () => {
  superAdmin = await createUser('super', 'super_admin');
  editor = await createUser('editor', 'content_editor');
  noRole = await createUser('norole', null);
});

afterAll(async () => {
  await owner.auditLog.deleteMany({ where: { actorId: { in: cleanup.users } } });
  await owner.session.deleteMany({ where: { userId: { in: cleanup.users } } });
  await owner.enquiry.deleteMany({ where: { id: { in: cleanup.enquiries } } });
  await owner.testimonial.deleteMany({ where: { id: { in: cleanup.testimonials } } });
  await owner.impactStat.deleteMany({ where: { id: { in: cleanup.impact } } });
  await owner.userRole.deleteMany({ where: { userId: { in: cleanup.users } } });
  await owner.user.deleteMany({ where: { id: { in: cleanup.users } } });
  await owner.$disconnect();
  await prisma.$disconnect();
});

describe('testimonials', () => {
  const payload = (over: Record<string, unknown> = {}) => ({
    displayName: 'Consenting supporter',
    location: 'Jaipur',
    body: 'A testimonial supplied by the person named, with written consent recorded.',
    consentEvidence: 'Signed consent form dated 2026-01-05, filed with the office',
    consentDate: '2026-01-05',
    displayOrder: 1,
    mediaId: null,
    ...over,
  });

  it('rejects a testimonial without consent evidence', async () => {
    const response = await call(
      superAdmin,
      'post',
      '/testimonials',
      payload({ consentEvidence: '' }),
    );
    expect(response.status).toBe(422);
  });

  it('creates it as pending and unpublished', async () => {
    const response = await call(superAdmin, 'post', '/testimonials', payload());

    expect(response.status).toBe(201);
    expect(response.body.data.approvalStatus).toBe('PENDING');
    expect(response.body.data.isVisible).toBe(false);
    cleanup.testimonials.push(response.body.data.id);
  });

  it('refuses publication before approval', async () => {
    const id = cleanup.testimonials[0] ?? '';
    const response = await call(superAdmin, 'post', `/testimonials/${id}/visibility`, {
      visible: true,
    });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('publishes once approved, and appears on the public API', async () => {
    const id = cleanup.testimonials[0] ?? '';

    const approved = await call(superAdmin, 'post', `/testimonials/${id}/approval`, {
      action: 'approve',
    });
    expect(approved.status).toBe(200);
    expect(approved.body.data.approvalStatus).toBe('APPROVED');

    const visible = await call(superAdmin, 'post', `/testimonials/${id}/visibility`, {
      visible: true,
    });
    expect(visible.status).toBe(200);

    const publicList = await request(app).get('/api/v1/public/testimonials');
    expect(publicList.status).toBe(200);
    expect(
      (publicList.body.data as { displayName: string }[]).some(
        (row) => row.displayName === 'Consenting supporter',
      ),
    ).toBe(true);
  });

  it('denies a user without roles', async () => {
    expect((await call(noRole, 'get', '/testimonials')).status).toBe(403);
  });
});

describe('impact statistics', () => {
  const payload = (over: Record<string, unknown> = {}) => ({
    label: 'Meals served (test)',
    value: 1200,
    unit: 'meals',
    methodology: 'Counted from the daily kitchen register for the reporting period.',
    sourceNote: 'Kitchen register 2026',
    periodLabel: '2025-26',
    displayOrder: 1,
    ...over,
  });

  it('rejects a negative value', async () => {
    const response = await call(superAdmin, 'post', '/impact', payload({ value: -5 }));
    expect(response.status).toBe(422);
  });

  it('creates it unverified and refuses publication', async () => {
    const created = await call(superAdmin, 'post', '/impact', payload());
    expect(created.status).toBe(201);
    cleanup.impact.push(created.body.data.id);

    const publish = await call(
      superAdmin,
      'post',
      `/impact/${String(created.body.data.id)}/visibility`,
      {
        visible: true,
      },
    );

    expect(publish.status).toBe(409);
  });

  it('verifies, publishes and exposes it publicly', async () => {
    const id = cleanup.impact[0] ?? '';

    const verified = await call(superAdmin, 'post', `/impact/${id}/verification`, {
      verified: true,
    });
    expect(verified.status).toBe(200);
    expect(verified.body.data.verificationStatus).toBe('VERIFIED');

    const visible = await call(superAdmin, 'post', `/impact/${id}/visibility`, { visible: true });
    expect(visible.status).toBe(200);

    const publicList = await request(app).get('/api/v1/public/impact');
    expect(publicList.status).toBe(200);
    expect(
      (publicList.body.data as { label: string }[]).some(
        (row) => row.label === 'Meals served (test)',
      ),
    ).toBe(true);
  });

  it('invalidates verification when the figure is edited', async () => {
    const id = cleanup.impact[0] ?? '';
    const edited = await call(superAdmin, 'put', `/impact/${id}`, payload({ value: 1300 }));

    expect(edited.status).toBe(200);
    expect(edited.body.data.verificationStatus).toBe('DRAFT');
    expect(edited.body.data.isVisible).toBe(false);
  });
});

describe('enquiries', () => {
  let id = '';

  beforeAll(async () => {
    const row = await owner.enquiry.create({
      data: {
        id: uuidv7(),
        reference: `ENQ-2026-${String(Date.now()).slice(-5)}`,
        type: 'CONTACT',
        name: 'Enquiry person',
        email: `enquiry-${PREFIX}@example.test`,
        message: 'A question submitted through the public contact form.',
        consentGivenAt: new Date(),
        consentVersion: 'v1',
        status: 'NEW',
        ipHash: 'a'.repeat(64),
        userAgent: 'test-agent',
      },
      select: { id: true },
    });

    id = row.id;
    cleanup.enquiries.push(id);
  });

  it('lists enquiries for an authorised administrator', async () => {
    const response = await call(superAdmin, 'get', '/enquiries');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('returns detail without personal network metadata', async () => {
    const response = await call(superAdmin, 'get', `/enquiries/${id}`);

    expect(response.status).toBe(200);
    expect(response.body.data.message).toContain('contact form');
    expect(response.body.data.ipHash).toBeUndefined();
    expect(response.body.data.userAgent).toBeUndefined();
  });

  it('applies valid transitions and rejects invalid ones', async () => {
    const moved = await call(superAdmin, 'post', `/enquiries/${id}/status`, {
      status: 'IN_PROGRESS',
    });
    expect(moved.status).toBe(200);

    // IN_PROGRESS cannot go back to NEW.
    const backwards = await call(superAdmin, 'post', `/enquiries/${id}/status`, { status: 'NEW' });
    expect(backwards.status).toBe(409);
    expect(backwards.body.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('writes an audit entry for each status change', async () => {
    const entries = await owner.auditLog.findMany({
      where: { entityType: 'ENQUIRY', entityId: id },
      select: { action: true },
    });

    expect(entries.map((entry) => entry.action)).toContain('enquiry.status');
  });

  it('denies a user without roles', async () => {
    expect((await call(noRole, 'get', `/enquiries/${id}`)).status).toBe(403);
  });
});

describe('administrator management', () => {
  let invitedId = '';

  it('invites an administrator without a password', async () => {
    const response = await call(superAdmin, 'post', '/users/invite', {
      email: `invited-${PREFIX}@example.test`,
      name: 'Invited Admin',
      roleKeys: ['content_editor'],
    });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('INVITED');
    expect(response.body.data.roles.map((role: { key: string }) => role.key)).toContain(
      'content_editor',
    );

    invitedId = response.body.data.id;
    cleanup.users.push(invitedId);
  });

  it('never returns a password hash', async () => {
    const response = await call(superAdmin, 'get', '/users');
    expect(response.status).toBe(200);
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
  });

  it('refuses a duplicate invitation', async () => {
    const response = await call(superAdmin, 'post', '/users/invite', {
      email: `invited-${PREFIX}@example.test`,
      name: 'Invited Admin',
      roleKeys: ['content_editor'],
    });

    expect(response.status).toBe(422);
  });

  it('revokes sessions when an account is deactivated', async () => {
    await owner.session.create({
      data: {
        id: uuidv7(),
        userId: invitedId,
        tokenHash: 'b'.repeat(64),
        csrfTokenHash: 'c'.repeat(64),
        expiresAt: new Date(Date.now() + 3_600_000),
      },
    });

    const response = await call(superAdmin, 'post', `/users/${invitedId}/status`, {
      status: 'DISABLED',
    });
    expect(response.status).toBe(200);

    const live = await owner.session.count({ where: { userId: invitedId, revokedAt: null } });
    expect(live).toBe(0);
  });

  it('protects the last active super administrator', async () => {
    // Demoting the only super administrator must fail.
    const response = await call(superAdmin, 'post', `/users/${superAdmin.id}/roles`, {
      roleKeys: ['content_editor'],
    });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('refuses to change your own account status', async () => {
    const response = await call(superAdmin, 'post', `/users/${superAdmin.id}/status`, {
      status: 'DISABLED',
    });
    expect(response.status).toBe(409);
  });

  it('denies administrator management to a content editor', async () => {
    expect((await call(editor, 'get', '/users')).status).toBe(403);
  });
});

describe('site settings', () => {
  beforeAll(async () => {
    await owner.setting.upsert({
      where: { key: 'site.general' },
      update: {},
      create: {
        key: 'site.general',
        category: 'site',
        value: { name: 'Shri Vanshidhar Gaushala' },
        description: 'General site identity',
      },
    });
  });

  it('reads settings for a super administrator', async () => {
    const response = await call(superAdmin, 'get', '/settings');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('denies settings to a user without roles', async () => {
    expect((await call(noRole, 'get', '/settings')).status).toBe(403);
  });

  it('rejects a non-http(s) URL', async () => {
    const response = await call(superAdmin, 'put', '/settings/site.general', {
      value: { name: 'Gaushala', websiteUrl: 'javascript:alert(1)' },
    });

    expect(response.status).toBe(422);
  });

  it('accepts a valid update and audits it', async () => {
    const response = await call(superAdmin, 'put', '/settings/site.general', {
      value: { name: 'Shri Vanshidhar Gaushala', websiteUrl: 'https://example.org' },
    });

    expect(response.status).toBe(200);

    const entries = await owner.auditLog.findMany({
      where: { entityType: 'SETTING', action: 'settings.update' },
      select: { after: true },
    });

    expect(
      entries.some((entry) => (entry.after as { key?: string } | null)?.key === 'site.general'),
    ).toBe(true);
  });

  it('requires CSRF on updates', async () => {
    const response = await request(app)
      .put('/api/v1/admin/settings/site.general')
      .set('cookie', superAdmin.cookie)
      .send({ value: { name: 'No CSRF' } });

    expect(response.status).toBe(403);
  });
});
