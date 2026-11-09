import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';

import type { PrismaClient } from '../../generated/prisma/client.js';

/**
 * Administrator authentication.
 *
 * Deliberate choices:
 *  - Argon2id for passwords (memory-hard, per OWASP);
 *  - opaque 256-bit session tokens, stored **hashed** — a database leak cannot be
 *    replayed;
 *  - CSRF tokens are separate, also hashed, and required on every mutation;
 *  - permissions are resolved from the database on each request (roles + per-user
 *    overrides, DENY wins) instead of being cached in the cookie.
 */

export const SESSION_COOKIE = 'gaushala_session';
export const CSRF_COOKIE = 'gaushala_csrf';
export const CSRF_HEADER = 'x-csrf-token';

export const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
export const SESSION_IDLE_MS = 60 * 60 * 1000; // 1 hour since last use

/**
 * Argon2id parameters. The library defaults to Argon2id; the explicit options
 * below are OWASP's baseline (19 MiB, t=2, p=1).
 */
const ARGON_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function randomToken(): string {
  return randomBytes(32).toString('base64url');
}

export async function hashPassword(password: string): Promise<string> {
  return argonHash(password, ARGON_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argonVerify(hash, password, ARGON_OPTIONS);
  } catch {
    return false;
  }
}

/** Constant-time comparison of two hex digests. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  return left.length === right.length && timingSafeEqual(left, right);
}

/* -------------------------------------------------------------------------- */
/* Sessions                                                                   */
/* -------------------------------------------------------------------------- */

export interface AuthenticatedAdmin {
  readonly userId: string;
  readonly email: string;
  readonly name: string;
  readonly isSuperAdmin: boolean;
  readonly permissions: readonly string[];
  readonly sessionId: string;
  readonly csrfTokenHash: string;
}

export async function createSession(
  prisma: PrismaClient,
  userId: string,
  context: { ipHash?: string | undefined; userAgent?: string | undefined; id: string },
): Promise<{ token: string; csrfToken: string; expiresAt: Date }> {
  const token = randomToken();
  const csrfToken = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      id: context.id,
      userId,
      tokenHash: sha256(token),
      csrfTokenHash: sha256(csrfToken),
      ipHash: context.ipHash ?? null,
      userAgent: context.userAgent?.slice(0, 500) ?? null,
      expiresAt,
    },
  });

  return { token, csrfToken, expiresAt };
}

export async function resolveSession(
  prisma: PrismaClient,
  token: string,
): Promise<AuthenticatedAdmin | null> {
  const now = new Date();

  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    select: {
      id: true,
      csrfTokenHash: true,
      expiresAt: true,
      revokedAt: true,
      lastUsedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          isSuperAdmin: true,
          deletedAt: true,
          roles: { select: { role: { select: { key: true } } } },
          permissionOverrides: { select: { effect: true, permission: { select: { key: true } } } },
        },
      },
    },
  });

  if (session === null) return null;
  if (session.revokedAt !== null) return null;
  if (session.expiresAt.getTime() <= now.getTime()) return null;
  if (session.lastUsedAt.getTime() + SESSION_IDLE_MS <= now.getTime()) return null;

  const user = session.user;

  if (user.status !== 'ACTIVE' || user.deletedAt !== null) return null;

  const permissions = await effectivePermissions(prisma, user.id, user.isSuperAdmin);

  // Touch the session at most once a minute to avoid a write per request.
  if (now.getTime() - session.lastUsedAt.getTime() > 60_000) {
    await prisma.session.update({ where: { id: session.id }, data: { lastUsedAt: now } });
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    isSuperAdmin: user.isSuperAdmin,
    permissions,
    sessionId: session.id,
    csrfTokenHash: session.csrfTokenHash,
  };
}

export async function revokeSession(
  prisma: PrismaClient,
  sessionId: string,
  reason: string,
): Promise<void> {
  await prisma.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason.slice(0, 80) },
  });
}

/* -------------------------------------------------------------------------- */
/* Permissions                                                                */
/* -------------------------------------------------------------------------- */

/** Role grants minus explicit DENY overrides. The wildcard is honoured. */
export async function effectivePermissions(
  prisma: PrismaClient,
  userId: string,
  isSuperAdmin: boolean,
): Promise<readonly string[]> {
  if (isSuperAdmin) return ['*'];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      roles: {
        select: {
          role: { select: { permissions: { select: { permission: { select: { key: true } } } } } },
        },
      },
      permissionOverrides: { select: { effect: true, permission: { select: { key: true } } } },
    },
  });

  if (user === null) return [];

  const granted = new Set<string>();

  for (const role of user.roles) {
    for (const entry of role.role.permissions) {
      if (entry.permission.key === '*') return ['*'];
      granted.add(entry.permission.key);
    }
  }

  for (const override of user.permissionOverrides) {
    if (override.effect === 'DENY') granted.delete(override.permission.key);
    else granted.add(override.permission.key);
  }

  return [...granted];
}

export function hasPermission(
  admin: AuthenticatedAdmin,
  required: string | readonly string[],
): boolean {
  if (admin.isSuperAdmin || admin.permissions.includes('*')) return true;

  const needed = typeof required === 'string' ? [required] : required;
  return needed.some((permission) => admin.permissions.includes(permission));
}
