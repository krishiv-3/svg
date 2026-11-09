import { type NextRequest, NextResponse } from 'next/server';

import { serverEnv } from '@/lib/server-env';

/**
 * Admin API proxy.
 *
 * The browser talks to this Next.js route on the same origin, and the route
 * forwards to the Express API with the visitor's cookies. That keeps the
 * session cookie first-party (SameSite=strict), avoids CORS entirely and means
 * the API origin is never exposed to the browser.
 */

export const dynamic = 'force-dynamic';

const FORWARDED_REQUEST_HEADERS = ['cookie', 'content-type', 'x-csrf-token', 'accept'];

async function forward(request: NextRequest, path: string[]): Promise<NextResponse> {
  const target = new URL(`/api/v1/admin/${path.join('/')}`, serverEnv.API_URL);
  target.search = request.nextUrl.search;

  const headers = new Headers();

  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }

  const body =
    request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text();

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    ...(body === undefined ? {} : { body }),
    redirect: 'manual',
    cache: 'no-store',
  });

  const response = new NextResponse(upstream.status === 204 ? null : await upstream.text(), {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  });

  // Pass Set-Cookie through untouched (login sets the session, logout clears it).
  for (const cookie of upstream.headers.getSetCookie()) {
    response.headers.append('set-cookie', cookie);
  }

  return response;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  return forward(request, (await context.params).path);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  return forward(request, (await context.params).path);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  return forward(request, (await context.params).path);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  return forward(request, (await context.params).path);
}
