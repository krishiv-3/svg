import express from 'express';
import type { Router } from 'express';

import { SERVICE_NAME, type ApiIndexResponse } from '@gaushala/shared';

import type { ServerEnv } from '../core/config/env.js';
import { createPublicContentRouter } from '../modules/content/content.routes.js';
import type { ContentModule } from '../modules/content/index.js';

/**
 * `/api/v1` root.
 *
 * Public content is mounted at `/api/v1/public`. Admin routes (Phase 7/8) and
 * donation routes (Phase 9) each get their own module here.
 */

export interface V1RouterDependencies {
  readonly config: ServerEnv;
  /** Built once at startup and shared with every public route. */
  readonly content: ContentModule;
}

export function createV1Router({ config, content }: V1RouterDependencies): Router {
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

  return router;
}
