import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { uuidv7 } from '@gaushala/shared';

import { PrismaClient } from '../src/generated/prisma/client.js';
import { hashPassword } from '../src/core/auth/index.js';

/**
 * One-time Super Admin bootstrap.
 *
 *   GAUSHALA_ADMIN_EMAIL=you@example.org \
 *   GAUSHALA_ADMIN_PASSWORD='…' \
 *   pnpm --filter @gaushala/api exec tsx prisma/bootstrap-admin.ts
 *
 * Rules:
 *  - credentials come from the environment (or an interactive prompt), never
 *    from code;
 *  - nothing is logged except the resulting account's e-mail;
 *  - idempotent: an existing account is updated in place, not duplicated;
 *  - it only ever creates/promotes a **Super Admin**, and refuses to run with a
 *    password shorter than 12 characters;
 *  - there is no public sign-up route, so this is the only way in.
 */

const connectionString = process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL;

if (connectionString === undefined) {
  console.error('bootstrap-admin: MIGRATE_DATABASE_URL or DATABASE_URL is required.');
  process.exit(1);
}

function readCredentials(): { email: string; password: string; name: string } {
  const email = process.env.GAUSHALA_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.GAUSHALA_ADMIN_PASSWORD;
  const name = process.env.GAUSHALA_ADMIN_NAME?.trim() ?? 'Super Admin';

  if (email === undefined || password === undefined) {
    console.error(
      'bootstrap-admin: set GAUSHALA_ADMIN_EMAIL and GAUSHALA_ADMIN_PASSWORD (min 12 chars).',
    );
    process.exit(1);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    console.error('bootstrap-admin: GAUSHALA_ADMIN_EMAIL is not a valid address.');
    process.exit(1);
  }

  if (password.length < 12) {
    console.error('bootstrap-admin: password must be at least 12 characters.');
    process.exit(1);
  }

  return { email, password, name };
}

async function main(): Promise<void> {
  const { email, password, name } = readCredentials();
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const passwordHash = await hashPassword(password);
    const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { key: 'super_admin' } });

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        status: 'ACTIVE',
        isSuperAdmin: true,
        passwordHash,
        passwordUpdatedAt: new Date(),
        mustChangePassword: false,
        deletedAt: null,
      },
      create: {
        id: uuidv7(),
        email,
        name,
        status: 'ACTIVE',
        isSuperAdmin: true,
        passwordHash,
        passwordUpdatedAt: new Date(),
        mustChangePassword: false,
      },
      select: { id: true, email: true },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: superAdminRole.id } },
      update: {},
      create: { userId: user.id, roleId: superAdminRole.id },
    });

    // Credentials are never logged.
    console.info(`bootstrap-admin: super admin ready for ${user.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    'bootstrap-admin failed:',
    error instanceof Error ? error.message : 'unknown error',
  );
  process.exitCode = 1;
});
