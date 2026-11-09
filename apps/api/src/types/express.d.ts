import type { Logger } from 'pino';

/**
 * Express request augmentation.
 *
 * `id` is set by the request-id middleware and `log` by pino-http before any
 * route runs.
 */
declare global {
  namespace Express {
    interface Request {
      id: string;
      log: Logger;
    }
  }
}

export {};
