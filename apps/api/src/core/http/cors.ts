import type { RequestHandler } from 'express';

/**
 * CORS for the browser-based admin application.
 *
 * Server-rendered pages call the API from the server, so CORS is not needed for
 * them. It exists for the Phase 8 admin UI, which runs in the browser and must
 * send session cookies. Only explicitly configured origins are allowed — there
 * is no wildcard path.
 */
export function createCorsMiddleware(allowedOrigins: readonly string[]): RequestHandler {
  const allowed = new Set(allowedOrigins.map((origin) => origin.toLowerCase()));

  return (request, response, next) => {
    const origin = request.get('origin');

    if (origin !== undefined) {
      const normalised = origin.toLowerCase();
      if (allowed.has(normalised)) {
        response.setHeader('Access-Control-Allow-Origin', origin);
        response.setHeader('Access-Control-Allow-Credentials', 'true');
        response.setHeader('Vary', 'Origin');
      } else {
        // Unknown origin: no CORS headers. The browser will block the response.
        // We do not 403 here — same-origin and server-to-server requests have no
        // Origin header at all and must keep working.
        response.setHeader('Vary', 'Origin');
      }
    }

    if (request.method === 'OPTIONS') {
      response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
      response.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, X-CSRF-Token, X-Request-Id, Idempotency-Key, If-Match',
      );
      response.setHeader('Access-Control-Max-Age', '600');
      response.status(204).end();
      return;
    }

    next();
  };
}
