import { existsSync } from 'node:fs';

import { PrismaPg } from '@prisma/adapter-pg';
import { config as loadEnv } from 'dotenv';

import { seedReferenceData } from '../prisma/seed.js';
import { PrismaClient } from '../src/generated/prisma/client.js';

/**
 * Integration test environment.
 *
 * Prefers `apps/api/.env.test` (the documented test configuration) and falls
 * back to whatever the CI job exports. `.env` is never used here: integration
 * tests must never touch the development database by accident.
 */
const testEnvFile = '.env.test';

if (existsSync(testEnvFile)) {
  loadEnv({ path: testEnvFile, override: true });
}

if (typeof process.env.DATABASE_URL !== 'string' || process.env.DATABASE_URL.length === 0) {
  throw new Error(
    'Integration tests need DATABASE_URL. Copy apps/api/.env.test.example to apps/api/.env.test ' +
      'and run `pnpm db:setup` first. See docs/DEVELOPMENT.md.',
  );
}

/**
 * Reference data must exist in the test database.
 *
 * Roles, permissions and settings are seeded into the *development* database by
 * `pnpm db:seed`; CI historically did that and then ran these tests against
 * `gaushala_test`, where the role catalogue was missing. A local machine only
 * passed because it had been seeded once by hand.
 *
 * Rather than depend on an earlier step, the setup ensures the catalogue itself.
 * It is idempotent (the seed upserts), and the guard keeps the usual case to a
 * single count query.
 */
const connectionString = process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

try {
  const roles = await prisma.role.count();

  if (roles === 0) {
    await seedReferenceData(prisma);
  }
} finally {
  await prisma.$disconnect();
}
