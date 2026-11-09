import type { RequestHandler } from 'express';

import { uuidv7 } from '@gaushala/shared';

/**
 * Request correlation.
 *
 * Accepts a caller-supplied `X-Request-Id` only when it matches a conservative
 * pattern (this value ends up in logs, so free-form text is refused), and
 * always echoes the effective id back in the response.
 */
const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{8,128}$/;

export function createRequestIdMiddleware(): RequestHandler {
  return (request, response, next) => {
    const incoming = request.get('x-request-id');
    const requestId =
      incoming !== undefined && SAFE_REQUEST_ID.test(incoming) ? incoming : uuidv7();

    request.id = requestId;
    response.setHeader('x-request-id', requestId);

    next();
  };
}
