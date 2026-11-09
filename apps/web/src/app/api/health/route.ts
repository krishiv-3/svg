import { NextResponse } from 'next/server';

import { serverEnv } from '@/lib/server-env';

/**
 * Web application health probe for the hosting platform.
 *
 * Distinct from the API health endpoint: this only proves the Next.js server is
 * serving requests.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'gaushala-web',
      version: serverEnv.WEB_VERSION,
      timestamp: new Date().toISOString(),
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}
