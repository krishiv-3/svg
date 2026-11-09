import type { MigrationsCheck } from '@gaushala/shared';

import type { PrismaClient } from '../../generated/prisma/client.js';

/**
 * Dependency probes for the readiness endpoint.
 *
 * These run on every probe, so they must be cheap and must never leak
 * connection strings or driver internals to a caller.
 */

export interface DatabaseCheck {
  status: 'up' | 'down';
  latencyMs?: number;
  detail?: string;
}

const DEFAULT_TIMEOUT_MS = 2_000;

function withTimeout<T>(operation: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    timer.unref();

    operation.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** Safe, non-revealing description of a failure (error class only). */
function describeFailure(error: unknown): string {
  if (error instanceof Error) {
    return error.name === 'Error' ? 'connection failed' : error.name;
  }
  return 'connection failed';
}

export async function checkDatabase(
  prisma: PrismaClient,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<DatabaseCheck> {
  const startedAt = performance.now();

  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, timeoutMs, 'database check');
    const latency = Math.round((performance.now() - startedAt) * 100) / 100;
    return { status: 'up', latencyMs: latency };
  } catch (error) {
    return { status: 'down', detail: describeFailure(error) };
  }
}

interface MigrationCountRow {
  pending: bigint | number;
  total: bigint | number;
}

/**
 * Report migration state by reading Prisma's own migration table.
 *
 * The API never runs migrations; it only reports whether the expected ones have
 * been applied. A pending or failed migration is a readiness failure, because
 * the running code and the schema would otherwise disagree.
 */
export async function checkMigrations(
  prisma: PrismaClient,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<MigrationsCheck> {
  try {
    const rows = await withTimeout(
      prisma.$queryRaw<MigrationCountRow[]>`
        SELECT
          count(*) FILTER (WHERE finished_at IS NULL AND rolled_back_at IS NULL) AS pending,
          count(*) AS total
        FROM _prisma_migrations
      `,
      timeoutMs,
      'migrations check',
    );

    const row = rows[0];
    const pending = Number(row?.pending ?? 0);
    const applied = Number(row?.total ?? 0);

    if (pending > 0) {
      return { status: 'down', applied, pending };
    }

    return { status: 'up', applied, pending };
  } catch (error) {
    // Typically: the database exists but has never been migrated.
    return {
      status: 'down',
      detail:
        describeFailure(error) === 'connection failed'
          ? 'migration history unavailable'
          : `migration history unavailable (${describeFailure(error)})`,
    };
  }
}
