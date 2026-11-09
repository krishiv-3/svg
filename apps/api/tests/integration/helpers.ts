import type { PrismaClient } from '../../src/generated/prisma/client.js';

import { parseEnv } from '../../src/core/config/env.js';
import { createPrismaClient } from '../../src/core/db/prisma.js';

/** Validated configuration for the integration run. */
export function testEnv() {
  return parseEnv(process.env);
}

/** Client bound to the least-privilege application role. */
export function appClient(): PrismaClient {
  return createPrismaClient(testEnv().databaseUrl);
}

/** Client bound to the owner role, used for reference-data seeding. */
export function ownerClient(): PrismaClient {
  const env = testEnv();
  return createPrismaClient(env.migrateDatabaseUrl ?? env.databaseUrl);
}
