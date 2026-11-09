import { afterAll, describe, expect, it } from 'vitest';

import { PERMISSIONS, ROLE_TEMPLATES, expandPermissions } from '@gaushala/shared';

import type { Prisma } from '../../src/generated/prisma/client.js';
import { seedReferenceData } from '../../prisma/seed.js';
import { ownerClient } from './helpers.js';

const prisma = ownerClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('reference-data seed', () => {
  it('is idempotent: a second run changes no counts', async () => {
    const first = await seedReferenceData(prisma);
    const second = await seedReferenceData(prisma);

    // `homepage` reports whether the singleton row had to be created, so the two
    // runs legitimately differ on that field only.
    expect({ ...second, homepage: 'same' }).toEqual({ ...first, homepage: 'same' });
    expect(first.homepage).toBe('created');
    expect(second.homepage).toBe('existing');
    expect(second.permissions).toBe(PERMISSIONS.length);
    expect(second.roles).toBe(ROLE_TEMPLATES.length);
  });

  it('stores exactly the permission catalogue defined in code', async () => {
    const rows = await prisma.permission.findMany({ select: { key: true } });
    const stored = rows.map((row) => row.key).sort();
    const expected = PERMISSIONS.map((permission) => permission.key).sort();

    expect(stored).toEqual(expected);
  });

  it('gives the content editor exactly its template permissions', async () => {
    const template = ROLE_TEMPLATES.find((role) => role.key === 'content_editor');
    expect(template).toBeDefined();

    const role = await prisma.role.findUniqueOrThrow({
      where: { key: 'content_editor' },
      include: { permissions: { include: { permission: true } } },
    });

    const granted = role.permissions.map((grant) => grant.permission.key).sort();
    const expected = [...expandPermissions(template?.permissions ?? [])].sort();

    expect(granted).toEqual(expected);
    expect(granted).not.toContain('user.manage');
  });

  it('creates the super admin as INVITED without a password', async () => {
    const email = (process.env.SEED_SUPER_ADMIN_EMAIL ?? 'admin@localhost.invalid')
      .trim()
      .toLowerCase();

    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
      include: { roles: { include: { role: true } } },
    });

    expect(user.isSuperAdmin).toBe(true);
    expect(user.status).toBe('INVITED');
    expect(user.passwordHash).toBeNull();
    expect(user.roles.map((assignment) => assignment.role.key)).toContain('super_admin');
  });

  it('seeds settings with online payments disabled and no invented facts', async () => {
    const donation = await prisma.setting.findUniqueOrThrow({ where: { key: 'donation.presets' } });
    expect(donation.value).toMatchObject({
      currency: 'INR',
      onlinePaymentsEnabled: false,
      providerMode: 'disabled',
    });

    const contact = await prisma.setting.findUniqueOrThrow({ where: { key: 'contact.details' } });
    expect(contact.value).toMatchObject({
      addressLines: [],
      phone: null,
      email: null,
    });
  });

  it('never overwrites an administrator-edited setting', async () => {
    const key = 'site.general';
    const original = await prisma.setting.findUniqueOrThrow({ where: { key } });

    await prisma.setting.update({
      where: { key },
      data: { value: { ...(original.value as Record<string, unknown>), maintenanceMode: true } },
    });

    await seedReferenceData(prisma);

    const after = await prisma.setting.findUniqueOrThrow({ where: { key } });
    expect(after.value).toMatchObject({ maintenanceMode: true });

    // Restore so repeated runs stay deterministic.
    await prisma.setting.update({
      where: { key },
      data: { value: original.value as unknown as Prisma.InputJsonValue },
    });
  });
});
