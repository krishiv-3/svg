import type { Logger } from 'pino';

import type { AuthenticatedAdmin } from '../core/auth/index.js';

/**
 * Express request augmentation.
 *
 * `id` is set by the request-id middleware and `log` by pino-http before any
 * route runs. `admin` is attached by the session middleware when a valid
 * administrator session cookie is present; its absence means "not signed in".
 */
declare global {
  namespace Express {
    interface Request {
      id: string;
      log: Logger;
      admin?: AuthenticatedAdmin;
    }
  }
}

export {};
