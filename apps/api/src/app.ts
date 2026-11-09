import express, { type Express } from 'express';
import type { Logger } from 'pino';
import { pinoHttp } from 'pino-http';

import type { ServerEnv } from './core/config/env.js';
import type { PrismaClient } from './generated/prisma/client.js';
import { createCorsMiddleware } from './core/http/cors.js';
import { createErrorHandler } from './core/http/error-handler.js';
import { createNotFoundHandler } from './core/http/not-found.js';
import { createRequestIdMiddleware } from './core/http/request-id.js';
import { createSecurityHeadersMiddleware } from './core/http/security-headers.js';
import { createHealthRouter } from './modules/health/health.routes.js';
import { createContentModule } from './modules/content/index.js';
import { createV1Router } from './routes/v1.js';

export interface AppDependencies {
  config: ServerEnv;
  logger: Logger;
  prisma: PrismaClient;
  startedAt?: Date;
}

/**
 * Build the Express application.
 *
 * Dependencies are injected rather than imported as singletons so tests can
 * construct an app against a throwaway database or a stubbed probe.
 *
 * Middleware order matters and mirrors docs/ARCHITECTURE.md §7.3:
 *   request id → request logging → security headers → CORS → body parsing →
 *   routes → 404 → error handler.
 */
export function createApp(dependencies: AppDependencies): Express {
  const { config, logger, prisma } = dependencies;
  const startedAt = dependencies.startedAt ?? new Date();

  const app = express();

  app.disable('x-powered-by');
  if (config.trustProxy) {
    app.set('trust proxy', 1);
  }

  app.use(createRequestIdMiddleware());

  app.use(
    pinoHttp({
      logger,
      genReqId: (request) => (request as unknown as { id: string }).id,
      customLogLevel: (_request, response, error) => {
        if (error !== undefined && error !== null) return 'error';
        if (response.statusCode >= 500) return 'error';
        if (response.statusCode >= 400) return 'warn';
        return 'info';
      },
      serializers: {
        req: (request: { id?: string; method?: string; url?: string }) => ({
          id: request.id,
          method: request.method,
          url: request.url,
        }),
        res: (response: { statusCode?: number }) => ({ statusCode: response.statusCode }),
      },
      autoLogging: {
        // Liveness probes would otherwise dominate the log.
        ignore: (request) => request.url === '/health/live',
      },
    }),
  );

  app.use(createSecurityHeadersMiddleware({ isProduction: config.isProduction }));
  app.use(createCorsMiddleware(config.corsOrigins));
  app.use(express.json({ limit: '256kb' }));

  app.use(createHealthRouter({ config, prisma, startedAt }));

  // One content module (and therefore one Prisma client) for the whole process.
  const content = createContentModule(prisma);
  app.use('/api/v1', createV1Router({ config, content }));

  app.use(createNotFoundHandler());
  app.use(createErrorHandler({ logger, isProduction: config.isProduction }));

  return app;
}
