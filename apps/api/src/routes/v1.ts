import express from 'express';
import type { Router } from 'express';

import { SERVICE_NAME, type ApiIndexResponse } from '@gaushala/shared';

import type { ServerEnv } from '../core/config/env.js';
import type { Logger } from 'pino';
import type { PrismaClient } from '../generated/prisma/client.js';
import { createAdminRouter } from '../modules/admin/admin.routes.js';
import { createPublicContentRouter } from '../modules/content/content.routes.js';
import type { ContentModule } from '../modules/content/index.js';

/**
 * `/api/v1` root.
 *
 * Public content at `/api/v1/public`; authenticated administration at
 * `/api/v1/admin`. Donation routes (Phase 9) get their own module here.
 */

export interface V1RouterDependencies {
  readonly config: ServerEnv;
  readonly prisma: PrismaClient;
  readonly logger: Logger;
  /** Built once at startup and shared with every public route. */
  readonly content: ContentModule;
}

export function createV1Router({ config, content, prisma, logger }: V1RouterDependencies): Router {
  const router = express.Router();

  router.get('/', (_request, response) => {
    const body: ApiIndexResponse = {
      name: SERVICE_NAME,
      version: config.version,
      environment: config.appEnv,
      docs: null,
    };
    response.status(200).setHeader('Cache-Control', 'no-store').json(body);
  });

  router.use('/public', createPublicContentRouter({ content }));
  router.use('/admin', createAdminRouter({ prisma, config, logger }));

  return router;
}
