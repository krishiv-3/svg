import 'server-only';

import { parseWebEnv } from './web-env';

/**
 * Server-side configuration for the web application.
 *
 * `server-only` guarantees this module can never be bundled into client
 * JavaScript, so the API URL and any future secrets stay on the server.
 *
 * Parsing happens at module load, which is also build time for the App Router:
 * a production build without a valid `NEXT_PUBLIC_SITE_URL` fails here rather
 * than shipping canonical URLs that point at localhost.
 */

export const serverEnv = parseWebEnv(
  {
    API_URL: process.env.API_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    WEB_VERSION: process.env.WEB_VERSION,
  },
  { isProduction: process.env.NODE_ENV === 'production' },
);
