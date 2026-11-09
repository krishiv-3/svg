import 'server-only';

import { cookies } from 'next/headers';

import { serverEnv } from '@/lib/server-env';

/**
 * Server-side admin data access.
 *
 * Admin pages are server components: they read the session cookie and call the
 * Express API directly (server-to-server), so the browser never sees the API
 * origin or the session token. Browser-side mutations go through the
 * same-origin proxy instead (see `app/api/admin/[...path]`).
 */

export interface AdminSession {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly isSuperAdmin: boolean;
  readonly permissions: readonly string[];
}

const BASE = '/api/v1/admin';

async function cookieHeader(): Promise<string> {
  const store = await cookies();
  return store
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');
}

export async function adminGet<T>(path: string): Promise<T | null> {
  const response = await fetch(new URL(`${BASE}${path}`, serverEnv.API_URL), {
    headers: { cookie: await cookieHeader(), accept: 'application/json' },
    cache: 'no-store',
  });

  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error(`Admin API ${String(response.status)} for ${path}`);

  const payload = (await response.json()) as { data: T };
  return payload.data;
}

export async function getSession(): Promise<AdminSession | null> {
  return adminGet<AdminSession>('/auth/me');
}

/** Read the CSRF cookie in a server action. */
export async function csrfToken(): Promise<string | undefined> {
  return (await cookies()).get('gaushala_csrf')?.value;
}
