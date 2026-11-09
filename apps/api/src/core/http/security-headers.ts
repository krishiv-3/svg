import type { RequestHandler } from 'express';

export interface SecurityHeadersOptions {
  isProduction: boolean;
}

/**
 * Security headers for a JSON API.
 *
 * The API returns no HTML, so the CSP is maximally strict; the web application
 * sets its own document CSP. HSTS is only sent when the deployment terminates
 * TLS upstream (production), never in local development.
 */
export function createSecurityHeadersMiddleware(options: SecurityHeadersOptions): RequestHandler {
  return (_request, response, next) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    );

    if (options.isProduction) {
      response.setHeader(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload',
      );
    }

    next();
  };
}
