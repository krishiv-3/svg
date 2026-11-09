import type { RequestHandler } from 'express';

import { NotFoundError } from './errors.js';

/**
 * Terminal 404 handler.
 *
 * Deliberately returns the same problem document shape as every other error so
 * clients need one parser. The path is included in the server-side message only;
 * the client receives a generic detail.
 */
export function createNotFoundHandler(): RequestHandler {
  return (request, _response, next) => {
    next(new NotFoundError(`No route matches ${request.method} ${request.path}`));
  };
}
