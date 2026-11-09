import express, { type Router } from 'express';
import { z } from 'zod';

import { uuidv7 } from '@gaushala/shared';

import type { PrismaClient } from '../../generated/prisma/client.js';
import type { ServerEnv } from '../../core/config/env.js';
import type { Logger } from 'pino';

import {
  SESSION_TTL_MS,
  createSession,
  revokeSession,
  sha256,
  verifyPassword,
} from '../../core/auth/index.js';
import {
  clearAuthCookies,
  createAuditWriter,
  createLoginRateLimiter,
  requireAdmin,
  requireCsrf,
  requirePermission,
  setCsrfCookie,
  setSessionCookie,
  withAdmin,
} from '../../core/auth/middleware.js';
import { AppError, NotFoundError, UnauthorizedError } from '../../core/http/errors.js';
import { publishCampaign } from './publishing.js';
import { createContentAdminRouter } from './admin-content.routes.js';

/**
 * Admin API: authentication and content management.
 *
 * Every route below is explicit about its guards:
 *   withAdmin → requireAdmin → requirePermission → requireCsrf (mutations)
 * so a new endpoint cannot be protected by accident.
 */

const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(200),
});

const campaignInputSchema = z.object({
  name: z.string().min(3).max(200),
  slug: z
    .string()
    .min(3)
    .max(160)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  purposeSummary: z.string().min(10).max(400),
  story: z.string().min(10).max(20_000),
  targetAmountMinor: z.number().int().positive().nullable(),
  manualRaisedMinor: z.number().int().min(0).nullable(),
  manualRaisedNote: z.string().max(2000).nullable(),
  progressSource: z.enum(['VERIFIED_DONATIONS', 'MANUAL']),
  startDate: z.iso.date(),
  endDate: z.iso.date().nullable(),
  isFeatured: z.boolean(),
  acceptsDonations: z.boolean(),
  seoTitle: z.string().max(70).nullable(),
  seoDescription: z.string().max(180).nullable(),
  version: z.number().int().min(1),
});

const publishSchema = z.object({
  action: z.enum(['publish', 'unpublish', 'archive', 'restore', 'schedule']),
  scheduledFor: z.iso.datetime().nullable().optional(),
});

export interface AdminRouterDependencies {
  readonly prisma: PrismaClient;
  readonly config: ServerEnv;
  readonly logger: Logger;
}

function toCampaignDto(row: {
  id: string;
  slug: string;
  name: string;
  purposeSummary: string;
  targetAmountMinor: bigint | null;
  manualRaisedMinor: bigint | null;
  progressSource: string;
  status: string;
  isFeatured: boolean;
  acceptsDonations: boolean;
  startDate: Date;
  endDate: Date | null;
  publishedAt: Date | null;
  scheduledFor: Date | null;
  version: number;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    purposeSummary: row.purposeSummary,
    targetAmountMinor: row.targetAmountMinor === null ? null : Number(row.targetAmountMinor),
    manualRaisedMinor: row.manualRaisedMinor === null ? null : Number(row.manualRaisedMinor),
    progressSource: row.progressSource,
    status: row.status,
    isFeatured: row.isFeatured,
    acceptsDonations: row.acceptsDonations,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate?.toISOString() ?? null,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    scheduledFor: row.scheduledFor?.toISOString() ?? null,
    version: row.version,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function createAdminRouter({ prisma, config, logger }: AdminRouterDependencies): Router {
  const router = express.Router();
  const audit = createAuditWriter(prisma, logger);
  const allowLogin = createLoginRateLimiter(prisma);
  const cookieOptions = { secure: config.isProduction };
  const campaignSelect = {
    id: true,
    slug: true,
    name: true,
    purposeSummary: true,
    targetAmountMinor: true,
    manualRaisedMinor: true,
    progressSource: true,
    status: true,
    isFeatured: true,
    acceptsDonations: true,
    startDate: true,
    endDate: true,
    publishedAt: true,
    scheduledFor: true,
    version: true,
    updatedAt: true,
  } as const;

  router.use(withAdmin(prisma));
  router.use(createContentAdminRouter({ prisma, audit }));

  /* --------------------------------------------------------------- session */

  router.post('/auth/login', async (request, response) => {
    const parsed = loginSchema.safeParse(request.body);

    if (!parsed.success) {
      throw new AppError('VALIDATION_FAILED', 422, 'Invalid credentials payload');
    }

    const email = parsed.data.email.trim().toLowerCase();
    const emailHash = sha256(email);
    const ipHash = sha256(request.ip ?? 'unknown');

    if (!(await allowLogin(emailHash, ipHash))) {
      await prisma.loginAttempt.create({
        data: { id: uuidv7(), emailHash, ipHash, success: false },
      });
      throw new AppError('RATE_LIMITED', 429, 'Too many attempts');
    }

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: { id: true, passwordHash: true, status: true, name: true, email: true },
    });

    const ok =
      user !== null &&
      user.status === 'ACTIVE' &&
      user.passwordHash !== null &&
      (await verifyPassword(user.passwordHash, parsed.data.password));

    await prisma.loginAttempt.create({
      data: { id: uuidv7(), emailHash, ipHash, success: ok },
    });

    if (!ok || user === null) {
      // Same message for unknown user and wrong password.
      throw new UnauthorizedError('Invalid email or password');
    }

    const session = await createSession(prisma, user.id, {
      id: uuidv7(),
      ipHash,
      userAgent: request.get('user-agent') ?? undefined,
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await audit({
      actorId: user.id,
      action: 'auth.login',
      entityType: 'USER',
      entityId: user.id,
      requestId: typeof request.id === 'string' ? request.id : null,
    });

    setSessionCookie(response, session.token, session.expiresAt, cookieOptions);
    setCsrfCookie(response, session.csrfToken, cookieOptions);

    response.status(200).json({ data: { id: user.id, name: user.name, email: user.email } });
  });

  router.post('/auth/logout', requireAdmin(), async (request, response) => {
    const admin = request.admin;

    if (admin !== undefined) {
      await revokeSession(prisma, admin.sessionId, 'logout');
      await audit({ actorId: admin.userId, action: 'auth.logout', entityType: 'SESSION' });
    }

    clearAuthCookies(response);
    response.status(204).end();
  });

  router.get('/auth/me', requireAdmin(), (request, response) => {
    const admin = request.admin;

    response.status(200).json({
      data: {
        id: admin?.userId,
        name: admin?.name,
        email: admin?.email,
        isSuperAdmin: admin?.isSuperAdmin,
        permissions: admin?.permissions ?? [],
        sessionExpiresInMs: SESSION_TTL_MS,
      },
    });
  });

  /* ------------------------------------------------------------- dashboard */

  router.get('/dashboard', requirePermission('dashboard.view'), async (_request, response) => {
    const [campaigns, news, events, enquiries, testimonials, impact] = await Promise.all([
      prisma.campaign.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.newsPost.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.event.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.enquiry.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.testimonial.count({ where: { deletedAt: null } }),
      prisma.impactStat.count({ where: { deletedAt: null } }),
    ]);

    const recentCampaigns = await prisma.campaign.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: campaignSelect,
    });

    const recentEnquiries = await prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        reference: true,
        name: true,
        subject: true,
        status: true,
        createdAt: true,
      },
    });

    response.status(200).json({
      data: {
        counts: {
          campaigns,
          news,
          events,
          enquiries,
          testimonials,
          impact,
        },
        recentCampaigns: recentCampaigns.map(toCampaignDto),
        recentEnquiries: recentEnquiries.map((row) => ({
          ...row,
          createdAt: row.createdAt.toISOString(),
        })),
      },
    });
  });

  /* ------------------------------------------------------------- campaigns */

  router.get('/campaigns', requirePermission('campaign.read'), async (_request, response) => {
    const rows = await prisma.campaign.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: campaignSelect,
    });

    response.status(200).json({ data: rows.map(toCampaignDto) });
  });

  router.get('/campaigns/:id', requirePermission('campaign.read'), async (request, response) => {
    const row = await prisma.campaign.findFirst({
      where: { id: String(request.params.id), deletedAt: null },
      select: { ...campaignSelect, story: true, seoTitle: true, seoDescription: true },
    });

    if (row === null) throw new NotFoundError('Campaign not found');

    response.status(200).json({
      data: {
        ...toCampaignDto(row),
        story: (row.story as { paragraphs?: string[] }).paragraphs?.join('\n\n') ?? '',
        seoTitle: row.seoTitle,
        seoDescription: row.seoDescription,
      },
    });
  });

  router.post(
    '/campaigns',
    requirePermission('campaign.create'),
    requireCsrf(),
    async (request, response) => {
      const parsed = campaignInputSchema.parse(request.body);

      const created = await prisma.campaign.create({
        data: {
          id: uuidv7(),
          slug: parsed.slug,
          name: parsed.name,
          purposeSummary: parsed.purposeSummary,
          story: { paragraphs: parsed.story.split(/\n{2,}/).filter(Boolean) },
          targetAmountMinor:
            parsed.targetAmountMinor === null ? null : BigInt(parsed.targetAmountMinor),
          manualRaisedMinor:
            parsed.manualRaisedMinor === null ? null : BigInt(parsed.manualRaisedMinor),
          manualRaisedNote: parsed.manualRaisedNote,
          progressSource: parsed.progressSource,
          startDate: new Date(parsed.startDate),
          endDate: parsed.endDate === null ? null : new Date(parsed.endDate),
          isFeatured: parsed.isFeatured,
          acceptsDonations: parsed.acceptsDonations,
          seoTitle: parsed.seoTitle,
          seoDescription: parsed.seoDescription,
          status: 'DRAFT',
          createdById: request.admin?.userId ?? null,
        },
        select: campaignSelect,
      });

      await audit({
        actorId: request.admin?.userId ?? null,
        action: 'campaign.create',
        entityType: 'CAMPAIGN',
        entityId: created.id,
        after: { slug: created.slug, status: created.status },
        requestId: typeof request.id === 'string' ? request.id : null,
      });

      response.status(201).json({ data: toCampaignDto(created) });
    },
  );

  router.put(
    '/campaigns/:id',
    requirePermission('campaign.update'),
    requireCsrf(),
    async (request, response) => {
      const parsed = campaignInputSchema.parse(request.body);

      const current = await prisma.campaign.findFirst({
        where: { id: String(request.params.id), deletedAt: null },
        select: { id: true, version: true, slug: true },
      });

      if (current === null) throw new NotFoundError('Campaign not found');

      if (current.version !== parsed.version) {
        throw new AppError(
          'VERSION_CONFLICT',
          409,
          `Version conflict: expected ${String(parsed.version)}, current ${String(current.version)}`,
        );
      }

      const updated = await prisma.campaign.update({
        where: { id: current.id },
        data: {
          slug: parsed.slug,
          name: parsed.name,
          purposeSummary: parsed.purposeSummary,
          story: { paragraphs: parsed.story.split(/\n{2,}/).filter(Boolean) },
          targetAmountMinor:
            parsed.targetAmountMinor === null ? null : BigInt(parsed.targetAmountMinor),
          manualRaisedMinor:
            parsed.manualRaisedMinor === null ? null : BigInt(parsed.manualRaisedMinor),
          manualRaisedNote: parsed.manualRaisedNote,
          progressSource: parsed.progressSource,
          startDate: new Date(parsed.startDate),
          endDate: parsed.endDate === null ? null : new Date(parsed.endDate),
          isFeatured: parsed.isFeatured,
          acceptsDonations: parsed.acceptsDonations,
          seoTitle: parsed.seoTitle,
          seoDescription: parsed.seoDescription,
          version: { increment: 1 },
          updatedById: request.admin?.userId ?? null,
        },
        select: campaignSelect,
      });

      await audit({
        actorId: request.admin?.userId ?? null,
        action: 'campaign.update',
        entityType: 'CAMPAIGN',
        entityId: updated.id,
        after: { status: updated.status, version: updated.version },
        requestId: typeof request.id === 'string' ? request.id : null,
      });

      response.status(200).json({ data: toCampaignDto(updated) });
    },
  );

  router.post(
    '/campaigns/:id/status',
    requirePermission('campaign.publish', 'campaign.update'),
    requireCsrf(),
    async (request, response) => {
      const { action } = publishSchema.parse(request.body);
      const current = await prisma.campaign.findFirst({
        where: { id: String(request.params.id), deletedAt: null },
        select: { id: true, status: true, version: true },
      });

      if (current === null) throw new NotFoundError('Campaign not found');

      const allowed: Record<string, string[]> = {
        publish: ['DRAFT', 'SCHEDULED', 'ARCHIVED'],
        unpublish: ['PUBLISHED'],
        archive: ['DRAFT', 'PUBLISHED', 'SCHEDULED'],
        restore: ['ARCHIVED'],
        schedule: ['DRAFT', 'SCHEDULED'],
      };

      if (!(allowed[action] ?? []).includes(current.status)) {
        throw new AppError(
          'INVALID_STATE_TRANSITION',
          409,
          `Cannot ${action} a ${current.status} campaign`,
        );
      }

      const now = new Date();
      const actorId = request.admin?.userId ?? null;

      if (action === 'schedule') {
        const { scheduledFor } = publishSchema.parse(request.body);
        const when =
          scheduledFor === null || scheduledFor === undefined ? null : new Date(scheduledFor);

        if (when === null || Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
          throw new AppError('VALIDATION_FAILED', 422, 'scheduledFor must be a future timestamp');
        }

        const scheduled = await prisma.campaign.update({
          where: { id: current.id },
          data: {
            status: 'SCHEDULED',
            scheduledFor: when,
            publishedAt: null,
            version: { increment: 1 },
            updatedById: actorId,
          },
          select: campaignSelect,
        });

        await audit({
          actorId,
          action: 'campaign.schedule',
          entityType: 'CAMPAIGN',
          entityId: scheduled.id,
          after: { scheduledFor: when.toISOString() },
          requestId: typeof request.id === 'string' ? request.id : null,
        });

        response.status(200).json({ data: toCampaignDto(scheduled) });
        return;
      }

      if (action === 'publish') {
        await publishCampaign(prisma, current.id, { actorId });

        const published = await prisma.campaign.findUniqueOrThrow({
          where: { id: current.id },
          select: campaignSelect,
        });

        await audit({
          actorId,
          action: 'campaign.publish',
          entityType: 'CAMPAIGN',
          entityId: published.id,
          before: { status: current.status },
          after: { status: published.status },
          requestId: typeof request.id === 'string' ? request.id : null,
        });

        response.status(200).json({ data: toCampaignDto(published) });
        return;
      }

      const data =
        action === 'unpublish'
          ? { status: 'DRAFT' as const, unpublishedAt: now, version: { increment: 1 } }
          : action === 'archive'
            ? { status: 'ARCHIVED' as const, version: { increment: 1 } }
            : { status: 'DRAFT' as const, version: { increment: 1 } };

      const updated = await prisma.campaign.update({
        where: { id: current.id },
        data: { ...data, updatedById: actorId },
        select: campaignSelect,
      });

      await audit({
        actorId,
        action: `campaign.${action}`,
        entityType: 'CAMPAIGN',
        entityId: updated.id,
        before: { status: current.status },
        after: { status: updated.status },
        requestId: typeof request.id === 'string' ? request.id : null,
      });

      response.status(200).json({ data: toCampaignDto(updated) });
    },
  );

  /* ------------------------------------------------- revisions and preview */

  router.get(
    '/campaigns/:id/revisions',
    requirePermission('campaign.read'),
    async (request, response) => {
      const rows = await prisma.revision.findMany({
        where: { entityType: 'CAMPAIGN', entityId: String(request.params.id) },
        orderBy: { version: 'desc' },
        select: {
          id: true,
          version: true,
          status: true,
          createdAt: true,
          publishedAt: true,
          snapshot: true,
        },
      });

      response.status(200).json({
        data: rows.map((row) => ({
          id: row.id,
          version: row.version,
          status: row.status,
          createdAt: row.createdAt.toISOString(),
          publishedAt: row.publishedAt?.toISOString() ?? null,
          snapshot: row.snapshot,
        })),
      });
    },
  );

  /**
   * Preview a campaign in any state, including drafts.
   *
   * Deliberately on the admin router: it requires a session and `campaign.read`,
   * and the response is `no-store` so a draft is never cached by a public CDN.
   */
  router.get(
    '/campaigns/:id/preview',
    requirePermission('campaign.read'),
    async (request, response) => {
      const row = await prisma.campaign.findFirst({
        where: { id: String(request.params.id), deletedAt: null },
        select: { ...campaignSelect, story: true, seoTitle: true, seoDescription: true },
      });

      if (row === null) throw new NotFoundError('Campaign not found');

      response
        .setHeader('Cache-Control', 'no-store, private')
        .status(200)
        .json({
          data: {
            ...toCampaignDto(row),
            story: (row.story as { paragraphs?: string[] }).paragraphs ?? [],
            seoTitle: row.seoTitle,
            seoDescription: row.seoDescription,
            preview: true,
          },
        });
    },
  );

  /* ------------------------------------------------------------- enquiries */

  router.get('/enquiries', requirePermission('enquiry.read'), async (request, response) => {
    const status = typeof request.query.status === 'string' ? request.query.status : undefined;

    const rows = await prisma.enquiry.findMany({
      where: status === undefined ? {} : { status: status as 'NEW' },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        reference: true,
        type: true,
        name: true,
        email: true,
        subject: true,
        status: true,
        createdAt: true,
      },
    });

    response.status(200).json({
      data: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    });
  });

  return router;
}

/** Used by the admin UI to know which modules it may render. */
export function requireAdminSession(): express.RequestHandler {
  return requireAdmin();
}
