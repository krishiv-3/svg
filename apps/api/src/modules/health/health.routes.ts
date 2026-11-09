import express from 'express';
import type { Router } from 'express';

import {
  SERVICE_NAME,
  type LivenessResponse,
  type ReadinessResponse,
  type VersionResponse,
} from '@gaushala/shared';

import type { ServerEnv } from '../../core/config/env.js';
import { checkDatabase, checkMigrations } from '../../core/db/health.js';
import type { PrismaClient } from '../../generated/prisma/client.js';

/**
 * Health, readiness and version endpoints.
 *
 * Mounted at the service root (not under /api/v1) so infrastructure can probe
 * them without knowing the API version — see docs/API_DESIGN.md §20.
 */

export interface HealthRouterDependencies {
  config: ServerEnv;
  prisma: PrismaClient;
  startedAt: Date;
}

export function createHealthRouter(dependencies: HealthRouterDependencies): Router {
  const { config, prisma, startedAt } = dependencies;
  const router = express.Router();

  const base = (): Omit<LivenessResponse, 'status'> => ({
    service: SERVICE_NAME,
    version: config.version,
    environment: config.appEnv,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime() * 1000) / 1000,
  });

  router.get('/health/live', (_request, response) => {
    const body: LivenessResponse = { ...base(), status: 'ok' };
    response.status(200).setHeader('Cache-Control', 'no-store').json(body);
  });

  router.get('/health/ready', async (_request, response) => {
    const database = await checkDatabase(prisma);
    const migrations =
      database.status === 'up'
        ? await checkMigrations(prisma)
        : { status: 'skipped' as const, detail: 'database unavailable' };

    const ready = database.status === 'up' && migrations.status === 'up';

    const body: ReadinessResponse = {
      ...base(),
      status: ready ? 'ok' : 'error',
      checks: { database, migrations },
    };

    response
      .status(ready ? 200 : 503)
      .setHeader('Cache-Control', 'no-store')
      .json(body);
  });

  router.get('/version', (_request, response) => {
    const body: VersionResponse = {
      service: SERVICE_NAME,
      version: config.version,
      environment: config.appEnv,
      nodeVersion: process.version,
      gitSha: config.gitSha,
      startedAt: startedAt.toISOString(),
    };
    response.status(200).setHeader('Cache-Control', 'no-store').json(body);
  });

  return router;
}
