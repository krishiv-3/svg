import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client.js';

/**
 * Remove test campaigns from a **development** database.
 *
 * Milestone fixtures use recognisable slug prefixes, so they are never confused
 * with real content and can be removed without touching anything else:
 *
 *   e2e-campaign-*  end-to-end verification campaigns
 *   preview-*       preview-content.ts fixtures
 *   adm-*-*         automated test campaigns
 *
 * Refuses to run in production. Revisions and audit rows belonging to a deleted
 * campaign are removed with it in one transaction.
 */

const appEnv = process.env.APP_ENV ?? 'development';

if (process.env.NODE_ENV === 'production' || appEnv === 'production') {
  console.error('cleanup-test-content: refusing to run in production.');
  process.exit(1);
}

const connectionString = process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL;

if (connectionString === undefined) {
  console.error('cleanup-test-content: MIGRATE_DATABASE_URL or DATABASE_URL is required.');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const PREFIXES = ['e2e-campaign-', 'preview-', 'adm-'];

async function main(): Promise<void> {
  const campaigns = await prisma.campaign.findMany({
    where: { OR: PREFIXES.map((prefix) => ({ slug: { startsWith: prefix } })) },
    select: { id: true, slug: true, status: true },
  });

  if (campaigns.length === 0) {
    console.info('cleanup-test-content: nothing to remove');
    return;
  }

  const ids = campaigns.map((row) => row.id);

  await prisma.$transaction([
    prisma.revision.deleteMany({ where: { entityType: 'CAMPAIGN', entityId: { in: ids } } }),
    prisma.campaign.deleteMany({ where: { id: { in: ids } } }),
  ]);

  for (const row of campaigns) {
    console.info(`removed ${row.slug} (${row.status})`);
  }

  console.info(`cleanup-test-content: removed ${String(campaigns.length)} test campaigns`);
}

main()
  .catch((error: unknown) => {
    console.error('cleanup-test-content failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
