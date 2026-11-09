import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../generated/prisma/client.js';

/**
 * Prisma client factory.
 *
 * Prisma 7 requires an explicit driver adapter; we use `@prisma/adapter-pg`
 * against the least-privilege application role. The client is created once at
 * startup and injected into the app — no module-level singleton, so tests can
 * build an isolated instance.
 */
export interface CreatePrismaClientOptions {
  /** Log every query at debug level; useful locally, never in production. */
  logQueries?: boolean;
}

export function createPrismaClient(
  databaseUrl: string,
  options: CreatePrismaClientOptions = {},
): PrismaClient {
  const adapter = new PrismaPg({ connectionString: databaseUrl });

  return new PrismaClient({
    adapter,
    log: options.logQueries ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });
}
