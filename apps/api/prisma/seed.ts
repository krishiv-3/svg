import 'dotenv/config';

import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { PrismaPg } from '@prisma/adapter-pg';

import { PERMISSIONS, ROLE_TEMPLATES, expandPermissions, uuidv7 } from '@gaushala/shared';

import { PrismaClient } from '../src/generated/prisma/client.js';
import type { Prisma } from '../src/generated/prisma/client.js';

/**
 * Idempotent reference-data seed.
 *
 * Safe to run repeatedly (acceptance criterion 2.5): every write is an upsert and
 * every derived set is reconciled, never appended blindly.
 *
 * It seeds:
 *  - the permission catalogue (source of truth: packages/shared)
 *  - the four system role templates and their permission sets
 *  - one Super Admin account, INVITED and without a password
 *  - default settings groups with explicit "not supplied yet" values
 *
 * It seeds NO Gaushala facts: no statistics, no testimonials, no contact
 * details. Those are supplied by the organisation in Phase 10.
 */

export interface SeedSummary {
  permissions: number;
  permissionsStored: number;
  roles: number;
  rolesStored: number;
  rolePermissions: number;
  settings: number;
  users: number;
  superAdminEmail: string;
  homepage: 'created' | 'existing';
}

async function seedPermissions(prisma: PrismaClient): Promise<number> {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
      },
      create: {
        id: uuidv7(),
        key: permission.key,
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
      },
    });
  }

  // Remove permissions that were dropped from the catalogue.
  await prisma.permission.deleteMany({
    where: { key: { notIn: PERMISSIONS.map((permission) => permission.key) } },
  });

  return PERMISSIONS.length;
}

async function seedRoles(prisma: PrismaClient): Promise<number> {
  for (const template of ROLE_TEMPLATES) {
    const role = await prisma.role.upsert({
      where: { key: template.key },
      update: {
        name: template.name,
        description: template.description,
        isSystem: template.isSystem,
      },
      create: {
        id: uuidv7(),
        key: template.key,
        name: template.name,
        description: template.description,
        isSystem: template.isSystem,
      },
    });

    const desiredKeys = expandPermissions(template.permissions);
    const permissionRows = await prisma.permission.findMany({
      where: { key: { in: desiredKeys } },
      select: { id: true },
    });

    const desiredIds = new Set(permissionRows.map((row) => row.id));

    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id, permissionId: { notIn: [...desiredIds] } },
    });

    if (desiredIds.size > 0) {
      await prisma.rolePermission.createMany({
        data: [...desiredIds].map((permissionId) => ({ roleId: role.id, permissionId })),
        skipDuplicates: true,
      });
    }
  }

  return ROLE_TEMPLATES.length;
}

async function seedSuperAdmin(prisma: PrismaClient): Promise<string> {
  const email = (process.env.SEED_SUPER_ADMIN_EMAIL ?? 'admin@localhost.invalid')
    .trim()
    .toLowerCase();
  const name = process.env.SEED_SUPER_ADMIN_NAME ?? 'Super Admin';

  const user = await prisma.user.upsert({
    where: { email },
    update: { isSuperAdmin: true },
    create: {
      id: uuidv7(),
      email,
      name,
      // No password yet: authentication (and Argon2id) arrives in Phase 7.
      status: 'INVITED',
      isSuperAdmin: true,
      mustChangePassword: true,
    },
  });

  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { key: 'super_admin' } });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: user.id, roleId: superAdminRole.id },
  });

  return email;
}

interface SettingSeed {
  key: string;
  category: string;
  description: string;
  value: Record<string, unknown>;
}

const DEFAULT_SETTINGS: readonly SettingSeed[] = [
  {
    key: 'site.general',
    category: 'general',
    description: 'Site identity. Organisation-specific values are supplied in Phase 10.',
    value: {
      siteName: 'Shri Vanshidhar Gaushala',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      maintenanceMode: false,
    },
  },
  {
    key: 'contact.details',
    category: 'contact',
    description: 'Verified address, phone, email, hours and social links. Empty until supplied.',
    value: {
      addressLines: [],
      phone: null,
      email: null,
      visitingHours: null,
      mapUrl: null,
      socialLinks: {},
    },
  },
  {
    key: 'seo.defaults',
    category: 'seo',
    description: 'Default metadata. Descriptions and social images await approved content.',
    value: {
      titleTemplate: '%s | Shri Vanshidhar Gaushala',
      defaultDescription: null,
      defaultSocialImageId: null,
      verification: { google: null, bing: null },
    },
  },
  {
    key: 'donation.presets',
    category: 'donation',
    description:
      'Suggested amounts (not minimums). Online payment stays disabled until the bank integration is approved.',
    value: {
      currency: 'INR',
      suggestedAmountsMinor: [10100, 25100, 50100, 100100],
      onlinePaymentsEnabled: false,
      providerMode: 'disabled',
    },
  },
];

async function seedSettings(prisma: PrismaClient): Promise<number> {
  for (const setting of DEFAULT_SETTINGS) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      // Never overwrite values an administrator has edited.
      update: {},
      create: {
        key: setting.key,
        category: setting.category,
        description: setting.description,
        value: setting.value as unknown as Prisma.InputJsonValue,
      },
    });
  }
  return DEFAULT_SETTINGS.length;
}

/**
 * Guarantee that a homepage row exists.
 *
 * The database enforces *at most one* homepage (partial unique index), not
 * "exactly one", so existence is an application guarantee. This runs in the
 * seed because that is the explicit, reviewable setup step — it is never called
 * from a read path.
 *
 * It creates a DRAFT with no sections: bootstrapping must never publish content,
 * so a fresh database serves 404 at `/public/homepage` until an editor
 * deliberately publishes a homepage.
 */
async function seedHomepage(prisma: PrismaClient): Promise<'created' | 'existing'> {
  const existing = await prisma.page.findFirst({
    where: { kind: 'HOMEPAGE', deletedAt: null },
    select: { id: true },
  });

  if (existing !== null) {
    return 'existing';
  }

  try {
    await prisma.page.create({
      data: {
        id: uuidv7(),
        kind: 'HOMEPAGE',
        slug: '',
        title: 'Homepage',
        template: 'HOMEPAGE',
        status: 'DRAFT',
      },
    });

    return 'created';
  } catch {
    // A concurrent bootstrapper won the unique index; that is success for us.
    const retry = await prisma.page.findFirst({
      where: { kind: 'HOMEPAGE', deletedAt: null },
      select: { id: true },
    });

    if (retry === null) throw new Error('homepage bootstrap failed');
    return 'existing';
  }
}

/** Apply the reference data. Safe to call any number of times. */
export async function seedReferenceData(prisma: PrismaClient): Promise<SeedSummary> {
  const permissions = await seedPermissions(prisma);
  const roles = await seedRoles(prisma);
  const superAdminEmail = await seedSuperAdmin(prisma);
  const settings = await seedSettings(prisma);
  const homepage = await seedHomepage(prisma);

  const [users, rolesStored, permissionsStored, rolePermissions] = await Promise.all([
    prisma.user.count(),
    prisma.role.count(),
    prisma.permission.count(),
    prisma.rolePermission.count(),
  ]);

  return {
    permissions,
    permissionsStored,
    roles,
    rolesStored,
    rolePermissions,
    settings,
    users,
    superAdminEmail,
    homepage,
  };
}

/** Resolve the database URL used for seeding. The owner role is required. */
export function resolveSeedConnectionString(): string {
  const connectionString = process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL;
  if (connectionString === undefined || connectionString.length === 0) {
    throw new Error('MIGRATE_DATABASE_URL (or DATABASE_URL) is required to run the seed');
  }
  return connectionString;
}

async function main(): Promise<void> {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: resolveSeedConnectionString() }),
  });

  try {
    const summary = await seedReferenceData(prisma);
    console.info(
      [
        'seed complete',
        `permissions=${String(summary.permissions)} catalogued / ${String(summary.permissionsStored)} stored`,
        `roles=${String(summary.roles)} templates / ${String(summary.rolesStored)} stored (${String(summary.rolePermissions)} grants)`,
        `settings=${String(summary.settings)} groups`,
        `users=${String(summary.users)}`,
        `superAdmin=${summary.superAdminEmail}`,
        `homepage=${summary.homepage}`,
      ].join(' | '),
    );
  } finally {
    await prisma.$disconnect();
  }
}

const invokedDirectly =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((error: unknown) => {
    console.error('seed failed:', error);
    process.exitCode = 1;
  });
}
