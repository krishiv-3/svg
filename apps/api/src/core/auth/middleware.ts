import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { Logger } from 'pino';

import { ForbiddenError, UnauthorizedError } from '../http/errors.js';
import type { PrismaClient } from '../../generated/prisma/client.js';

import {
  CSRF_COOKIE,
  CSRF_HEADER,
  SESSION_COOKIE,
  hasPermission,
  resolveSession,
  safeEqual,
  sha256,
  type AuthenticatedAdmin,
} from './index.js';

/**
 * Admin request guards.
 *
 * Each guard is explicit in the route table, so a new endpoint cannot inherit
 * protection by accident — it must opt in, and the default is 403.
 *
 * `request.admin` is declared in `src/types/express.d.ts`.
 */

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.cookie;

  if (header === undefined) return undefined;

  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');

    if (key === name) return decodeURIComponent(rest.join('='));
  }

  return undefined;
}

/** Resolve the session (if any) and attach the administrator. Never throws. */
export function withAdmin(prisma: PrismaClient): RequestHandler {
  return (request, _response, next) => {
    const token = readCookie(request, SESSION_COOKIE);

    if (token === undefined) {
      next();
      return;
    }

    resolveSession(prisma, token)
      .then((admin) => {
        if (admin !== null) request.admin = admin;
        next();
      })
      .catch(next);
  };
}

/** 401 unless an administrator is attached. */
export function requireAdmin(): RequestHandler {
  return (request, _response, next) => {
    if (request.admin === undefined) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    next();
  };
}

/**
 * 403 unless the administrator holds one of the permission keys.
 * Deny-by-default: an empty requirement list still requires a super admin.
 */
export function requirePermission(...permissions: string[]): RequestHandler {
  return (request, _response, next) => {
    const admin = request.admin;

    if (admin === undefined) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (permissions.length === 0) {
      next(admin.isSuperAdmin ? undefined : new ForbiddenError('Permission denied'));
      return;
    }

    if (!hasPermission(admin, permissions)) {
      next(new ForbiddenError('Permission denied'));
      return;
    }

    next();
  };
}

/**
 * Double-submit CSRF: the token in the header must hash to the value stored with
 * the session. Required on every state-changing admin request.
 */
export function requireCsrf(): RequestHandler {
  return (request, _response, next) => {
    const admin = request.admin;

    if (admin === undefined) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    const header = request.get(CSRF_HEADER);

    if (header === undefined || header.length === 0) {
      next(new ForbiddenError('CSRF token missing'));
      return;
    }

    if (!safeEqual(sha256(header), admin.csrfTokenHash)) {
      next(new ForbiddenError('CSRF token invalid'));
      return;
    }

    next();
  };
}

/* -------------------------------------------------------------------------- */
/* Cookie helpers                                                             */
/* -------------------------------------------------------------------------- */

export interface CookieOptions {
  readonly secure: boolean;
}

export function setSessionCookie(
  response: Response,
  token: string,
  expiresAt: Date,
  options: CookieOptions,
): void {
  response.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: options.secure,
    sameSite: 'strict',
    path: '/',
    expires: expiresAt,
  });
}

export function setCsrfCookie(response: Response, csrfToken: string, options: CookieOptions): void {
  // Readable by the admin app only (same origin); it is not a bearer credential.
  response.cookie(CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    secure: options.secure,
    sameSite: 'strict',
    path: '/',
  });
}

export function clearAuthCookies(response: Response): void {
  response.clearCookie(SESSION_COOKIE, { path: '/' });
  response.clearCookie(CSRF_COOKIE, { path: '/' });
}

/* -------------------------------------------------------------------------- */
/* Login rate limiting                                                        */
/* -------------------------------------------------------------------------- */

export interface RateLimitOptions {
  readonly windowMs: number;
  readonly max: number;
}

/**
 * Database-backed limiter.
 *
 * A dedicated store (Redis) is not justified at this scale; the login attempt
 * table is small, indexed and already records what security needs for incident
 * response.
 */
export function createLoginRateLimiter(
  prisma: PrismaClient,
  options: RateLimitOptions = { windowMs: 15 * 60 * 1000, max: 10 },
): (emailHash: string, ipHash: string | undefined) => Promise<boolean> {
  return async (emailHash, ipHash) => {
    const since = new Date(Date.now() - options.windowMs);

    const [byEmail, byIp] = await Promise.all([
      prisma.loginAttempt.count({
        where: { emailHash, success: false, createdAt: { gte: since } },
      }),
      ipHash === undefined
        ? Promise.resolve(0)
        : prisma.loginAttempt.count({
            where: { ipHash, success: false, createdAt: { gte: since } },
          }),
    ]);

    return byEmail < options.max && byIp < options.max * 3;
  };
}

export function createAuditWriter(prisma: PrismaClient, logger: Logger) {
  return async (entry: {
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    before?: unknown;
    after?: unknown;
    requestId?: string | null;
  }): Promise<void> => {
    try {
      await prisma.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          actorId: entry.actorId ?? null,
          action: entry.action.slice(0, 80),
          entityType: entry.entityType.slice(0, 40),
          entityId: entry.entityId ?? null,
          ...(entry.before === undefined ? {} : { before: entry.before as object }),
          ...(entry.after === undefined ? {} : { after: entry.after as object }),
          requestId: entry.requestId ?? null,
        },
      });
    } catch (error) {
      // Auditing must never break the request, but it must be visible.
      logger.error({ err: error, action: entry.action }, 'audit write failed');
    }
  };
}

export type NextHandler = (error?: unknown) => void;
export type AdminRequest = Request & { admin?: AuthenticatedAdmin };
export type AdminResponse = Response;
export type AdminNext = NextFunction;
