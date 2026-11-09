import 'dotenv/config';

import { createServer } from 'node:http';

import { SERVICE_NAME } from '@gaushala/shared';

import { createApp } from './app.js';
import { EnvValidationError, getEnv } from './core/config/env.js';
import { createPrismaClient } from './core/db/prisma.js';
import { createLogger } from './core/logging/logger.js';
import { startScheduler } from './modules/admin/publishing.js';

/**
 * API entry point.
 *
 * Boots in a fixed order — configuration, logging, database client, HTTP server
 * — so a misconfiguration fails before any port is opened.
 */
async function main(): Promise<void> {
  const config = getEnv();

  const logger = createLogger({
    level: config.logLevel,
    pretty: config.logPretty,
    service: SERVICE_NAME,
    version: config.version,
    isProduction: config.isProduction,
  });

  const prisma = createPrismaClient(config.databaseUrl);
  const app = createApp({ config, logger, prisma });
  const server = createServer(app);

  // Publish scheduled campaigns. A plain interval is enough for one API
  // instance; the publisher itself is idempotent and transactional.
  const stopScheduler = startScheduler(prisma, logger);

  server.listen(config.port, config.host, () => {
    logger.info(
      {
        port: config.port,
        host: config.host,
        environment: config.appEnv,
        version: config.version,
      },
      'api listening',
    );
  });

  let shuttingDown = false;

  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'shutting down');

    const forceExit = setTimeout(() => {
      logger.error('graceful shutdown timed out; forcing exit');
      process.exit(1);
    }, config.shutdownTimeoutMs);
    forceExit.unref();

    stopScheduler();

    server.close(() => {
      void prisma
        .$disconnect()
        .catch((error: unknown) => {
          logger.error({ err: error }, 'failed to disconnect database');
        })
        .finally(() => {
          clearTimeout(forceExit);
          logger.info('shutdown complete');
          process.exit(0);
        });
    });
  };

  process.once('SIGTERM', () => {
    shutdown('SIGTERM');
  });
  process.once('SIGINT', () => {
    shutdown('SIGINT');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'unhandled promise rejection');
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'uncaught exception');
    shutdown('uncaughtException');
  });
}

main().catch((error: unknown) => {
  if (error instanceof EnvValidationError) {
    console.error(error.message);
  } else {
    console.error('Failed to start the API:', error);
  }
  process.exit(1);
});
