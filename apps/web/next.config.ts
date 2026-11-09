import type { NextConfig } from 'next';

/**
 * Next.js configuration.
 *
 * The web application never talks to PostgreSQL: every piece of data comes from
 * the Express API through `src/lib/api-client.ts`. There is no database driver
 * in this package's dependencies, and `pnpm` would fail the build if one were
 * imported without being declared.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The shared package ships compiled ESM; Next transpiles it for the server and
  // client bundles alike.
  transpilePackages: ['@gaushala/shared'],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
