import express, { type Router } from 'express';
import { z } from 'zod';

import { uuidv7 } from '@gaushala/shared';

import type { PrismaClient } from '../../generated/prisma/client.js';

import { AppError, NotFoundError } from '../../core/http/errors.js';
import { requireCsrf, requirePermission } from '../../core/auth/middleware.js';
import { publishEntity } from './publishing.js';

/**
 * Admin management for Activities, Events and News.
 *
 * Mirrors the campaign workflow: every module has list, get, create, update and
 * a guarded status transition. Publish rules are identical across content types,
 * so the transition table lives here once.
 */

type ContentAction = 'publish' | 'unpublish' | 'archive' | 'restore' | 'schedule';

const TRANSITIONS: Record<ContentAction, readonly string[]> = {
  publish: ['DRAFT', 'SCHEDULED', 'ARCHIVED'],
  unpublish: ['PUBLISHED'],
  archive: ['DRAFT', 'PUBLISHED', 'SCHEDULED'],
  restore: ['ARCHIVED'],
  schedule: ['DRAFT', 'SCHEDULED'],
};

const statusSchema = z.object({
  action: z.enum(['publish', 'unpublish', 'archive', 'restore', 'schedule']),
  scheduledFor: z.iso.datetime().nullable().optional(),
});

const slug = z
  .string()
  .min(3)
  .max(160)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

const seoSchema = {
  seoTitle: z.string().max(70).nullable(),
  seoDescription: z.string().max(180).nullable(),
  noindex: z.boolean(),
};

const activitySchema = z.object({
  title: z.string().min(3).max(200),
  slug,
  shortDescription: z.string().min(10).max(400),
  body: z.string().min(10).max(20_000),
  category: z.string().max(60).nullable(),
  location: z.string().max(200).nullable(),
  isFeatured: z.boolean(),
  version: z.number().int().min(1),
  ...seoSchema,
});

const eventSchema = z.object({
  title: z.string().min(3).max(200),
  slug,
  description: z.string().min(10).max(20_000),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime().nullable(),
  venueName: z.string().max(200).nullable(),
  venueAddress: z.string().max(500).nullable(),
  // Optional, but when present it must be a real http(s) URL. `z.url()` alone
  // accepts any scheme, including `javascript:`.
  registrationUrl: z
    .url({ protocol: /^https?$/ })
    .max(500)
    .nullable(),
  isFeatured: z.boolean(),
  version: z.number().int().min(1),
  ...seoSchema,
});

const newsSchema = z.object({
  title: z.string().min(3).max(200),
  slug,
  excerpt: z.string().min(10).max(400),
  body: z.string().min(10).max(40_000),
  categoryId: z.uuid().nullable(),
  attributionName: z.string().max(120).nullable(),
  readingMinutes: z.number().int().min(1).max(120).nullable(),
  version: z.number().int().min(1),
  ...seoSchema,
});

const categorySchema = z.object({
  name: z.string().min(2).max(80),
  slug,
});

const paragraphs = (text: string): { paragraphs: string[] } => ({
  paragraphs: text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean),
});

export interface ContentAdminDependencies {
  readonly prisma: PrismaClient;
  readonly audit: (entry: {
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    before?: unknown;
    after?: unknown;
    requestId?: string | null;
  }) => Promise<void>;
}

/** Shared validation of a status transition, returning the update payload. */
function transitionData(
  action: ContentAction,
  current: string,
  scheduledFor: string | null | undefined,
  actorId: string | null,
  now: Date,
): Record<string, unknown> {
  if (!(TRANSITIONS[action] ?? []).includes(current)) {
    throw new AppError('INVALID_STATE_TRANSITION', 409, `Cannot ${action} a ${current} item`);
  }

  const base = { updatedById: actorId };

  if (action === 'schedule') {
    const when =
      scheduledFor === null || scheduledFor === undefined ? null : new Date(scheduledFor);

    if (when === null || Number.isNaN(when.getTime()) || when.getTime() <= now.getTime()) {
      throw new AppError('VALIDATION_FAILED', 422, 'scheduledFor must be a future timestamp');
    }

    return { ...base, status: 'SCHEDULED', scheduledFor: when, publishedAt: null };
  }

  if (action === 'publish') {
    return {
      ...base,
      status: 'PUBLISHED',
      publishedAt: now,
      unpublishedAt: null,
      scheduledFor: null,
    };
  }

  if (action === 'unpublish') return { ...base, status: 'DRAFT', unpublishedAt: now };
  if (action === 'archive') return { ...base, status: 'ARCHIVED' };
  return { ...base, status: 'DRAFT' };
}

export function createContentAdminRouter({ prisma, audit }: ContentAdminDependencies): Router {
  const router = express.Router();
  const actor = (request: express.Request): string | null => request.admin?.userId ?? null;
  const requestId = (request: express.Request): string | null =>
    typeof request.id === 'string' ? request.id : null;

  /* ------------------------------------------------------------- activities */

  router.get('/activities', requirePermission('activity.read'), async (_request, response) => {
    const rows = await prisma.activity.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        isFeatured: true,
        updatedAt: true,
        version: true,
      },
    });

    response.status(200).json({
      data: rows.map((row) => ({ ...row, updatedAt: row.updatedAt.toISOString() })),
    });
  });

  router.get('/activities/:id', requirePermission('activity.read'), async (request, response) => {
    const row = await prisma.activity.findFirst({
      where: { id: String(request.params.id), deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        body: true,
        category: true,
        location: true,
        isFeatured: true,
        status: true,
        version: true,
        seoTitle: true,
        seoDescription: true,
        noindex: true,
      },
    });

    if (row === null) throw new NotFoundError('Activity not found');

    response.status(200).json({
      data: {
        ...row,
        body: (row.body as { paragraphs?: string[] } | null)?.paragraphs?.join('\n\n') ?? '',
      },
    });
  });

  router.post(
    '/activities',
    requirePermission('activity.create'),
    requireCsrf(),
    async (request, response) => {
      const input = activitySchema.parse(request.body);
      const created = await prisma.activity.create({
        data: {
          id: uuidv7(),
          title: input.title,
          slug: input.slug,
          shortDescription: input.shortDescription,
          body: paragraphs(input.body),
          category: input.category,
          location: input.location,
          isFeatured: input.isFeatured,
          seoTitle: input.seoTitle,
          seoDescription: input.seoDescription,
          noindex: input.noindex,
          createdById: actor(request),
        },
        select: { id: true, slug: true, status: true, version: true },
      });

      await audit({
        actorId: actor(request),
        action: 'activity.create',
        entityType: 'ACTIVITY',
        entityId: created.id,
        requestId: requestId(request),
      });

      response.status(201).json({ data: created });
    },
  );

  router.put(
    '/activities/:id',
    requirePermission('activity.update'),
    requireCsrf(),
    async (request, response) => {
      const input = activitySchema.parse(request.body);
      const current = await prisma.activity.findFirst({
        where: { id: String(request.params.id), deletedAt: null },
        select: { id: true, version: true },
      });

      if (current === null) throw new NotFoundError('Activity not found');

      if (current.version !== input.version) {
        throw new AppError('VERSION_CONFLICT', 409, 'This activity changed since it was opened');
      }

      const updated = await prisma.activity.update({
        where: { id: current.id },
        data: {
          title: input.title,
          slug: input.slug,
          shortDescription: input.shortDescription,
          body: paragraphs(input.body),
          category: input.category,
          location: input.location,
          isFeatured: input.isFeatured,
          seoTitle: input.seoTitle,
          seoDescription: input.seoDescription,
          noindex: input.noindex,
          version: { increment: 1 },
          updatedById: actor(request),
        },
        select: { id: true, slug: true, status: true, version: true },
      });

      await audit({
        actorId: actor(request),
        action: 'activity.update',
        entityType: 'ACTIVITY',
        entityId: updated.id,
        requestId: requestId(request),
      });

      response.status(200).json({ data: updated });
    },
  );

  router.post(
    '/activities/:id/status',
    requirePermission('activity.publish', 'activity.update'),
    requireCsrf(),
    async (request, response) => {
      const { action, scheduledFor } = statusSchema.parse(request.body);
      const current = await prisma.activity.findFirst({
        where: { id: String(request.params.id), deletedAt: null },
        select: { id: true, status: true },
      });

      if (current === null) throw new NotFoundError('Activity not found');

      if (action === 'publish') {
        await publishEntity(prisma, 'ACTIVITY', current.id, { actorId: actor(request) });
        const published = await prisma.activity.findUniqueOrThrow({
          where: { id: current.id },
          select: { id: true, slug: true, status: true, version: true },
        });

        await audit({
          actorId: actor(request),
          action: 'activity.publish',
          entityType: 'ACTIVITY',
          entityId: published.id,
          before: { status: current.status },
          after: { status: published.status },
          requestId: requestId(request),
        });

        response.status(200).json({ data: published });
        return;
      }

      const data = transitionData(action, current.status, scheduledFor, actor(request), new Date());
      const updated = await prisma.activity.update({
        where: { id: current.id },
        data: { ...data, version: { increment: 1 } },
        select: { id: true, slug: true, status: true, version: true },
      });

      await audit({
        actorId: actor(request),
        action: `activity.${action}`,
        entityType: 'ACTIVITY',
        entityId: updated.id,
        before: { status: current.status },
        after: { status: updated.status },
        requestId: requestId(request),
      });

      response.status(200).json({ data: updated });
    },
  );

  /* ----------------------------------------------------------------- events */

  router.get('/events', requirePermission('event.read'), async (_request, response) => {
    const rows = await prisma.event.findMany({
      where: { deletedAt: null },
      orderBy: { startAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        startAt: true,
        venueName: true,
        updatedAt: true,
        version: true,
      },
    });

    response.status(200).json({
      data: rows.map((row) => ({
        ...row,
        startAt: row.startAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
    });
  });

  router.get('/events/:id', requirePermission('event.read'), async (request, response) => {
    const row = await prisma.event.findFirst({
      where: { id: String(request.params.id), deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        startAt: true,
        endAt: true,
        venueName: true,
        venueAddress: true,
        registrationUrl: true,
        isFeatured: true,
        status: true,
        version: true,
        seoTitle: true,
        seoDescription: true,
        noindex: true,
      },
    });

    if (row === null) throw new NotFoundError('Event not found');

    response.status(200).json({
      data: {
        ...row,
        description: (row.description as { paragraphs?: string[] }).paragraphs?.join('\n\n') ?? '',
        startAt: row.startAt.toISOString(),
        endAt: row.endAt?.toISOString() ?? null,
      },
    });
  });

  router.post(
    '/events',
    requirePermission('event.create'),
    requireCsrf(),
    async (request, response) => {
      const input = eventSchema.parse(request.body);
      const created = await prisma.event.create({
        data: {
          id: uuidv7(),
          title: input.title,
          slug: input.slug,
          description: paragraphs(input.description),
          startAt: new Date(input.startAt),
          endAt: input.endAt === null ? null : new Date(input.endAt),
          venueName: input.venueName,
          venueAddress: input.venueAddress,
          registrationUrl: input.registrationUrl,
          isFeatured: input.isFeatured,
          seoTitle: input.seoTitle,
          seoDescription: input.seoDescription,
          noindex: input.noindex,
          createdById: actor(request),
        },
        select: { id: true, slug: true, status: true, version: true },
      });

      await audit({
        actorId: actor(request),
        action: 'event.create',
        entityType: 'EVENT',
        entityId: created.id,
        requestId: requestId(request),
      });

      response.status(201).json({ data: created });
    },
  );

  router.put(
    '/events/:id',
    requirePermission('event.update'),
    requireCsrf(),
    async (request, response) => {
      const input = eventSchema.parse(request.body);
      const current = await prisma.event.findFirst({
        where: { id: String(request.params.id), deletedAt: null },
        select: { id: true, version: true },
      });

      if (current === null) throw new NotFoundError('Event not found');
      if (current.version !== input.version) {
        throw new AppError('VERSION_CONFLICT', 409, 'This event changed since it was opened');
      }

      const updated = await prisma.event.update({
        where: { id: current.id },
        data: {
          title: input.title,
          slug: input.slug,
          description: paragraphs(input.description),
          startAt: new Date(input.startAt),
          endAt: input.endAt === null ? null : new Date(input.endAt),
          venueName: input.venueName,
          venueAddress: input.venueAddress,
          registrationUrl: input.registrationUrl,
          isFeatured: input.isFeatured,
          seoTitle: input.seoTitle,
          seoDescription: input.seoDescription,
          noindex: input.noindex,
          version: { increment: 1 },
          updatedById: actor(request),
        },
        select: { id: true, slug: true, status: true, version: true },
      });

      await audit({
        actorId: actor(request),
        action: 'event.update',
        entityType: 'EVENT',
        entityId: updated.id,
        requestId: requestId(request),
      });

      response.status(200).json({ data: updated });
    },
  );

  router.post(
    '/events/:id/status',
    requirePermission('event.publish', 'event.update'),
    requireCsrf(),
    async (request, response) => {
      const { action, scheduledFor } = statusSchema.parse(request.body);
      const current = await prisma.event.findFirst({
        where: { id: String(request.params.id), deletedAt: null },
        select: { id: true, status: true },
      });

      if (current === null) throw new NotFoundError('Event not found');

      if (action === 'publish') {
        await publishEntity(prisma, 'EVENT', current.id, { actorId: actor(request) });
        const published = await prisma.event.findUniqueOrThrow({
          where: { id: current.id },
          select: { id: true, slug: true, status: true, version: true },
        });

        await audit({
          actorId: actor(request),
          action: 'event.publish',
          entityType: 'EVENT',
          entityId: published.id,
          before: { status: current.status },
          after: { status: published.status },
          requestId: requestId(request),
        });

        response.status(200).json({ data: published });
        return;
      }

      const data = transitionData(action, current.status, scheduledFor, actor(request), new Date());
      const updated = await prisma.event.update({
        where: { id: current.id },
        data: { ...data, version: { increment: 1 } },
        select: { id: true, slug: true, status: true, version: true },
      });

      await audit({
        actorId: actor(request),
        action: `event.${action}`,
        entityType: 'EVENT',
        entityId: updated.id,
        before: { status: current.status },
        after: { status: updated.status },
        requestId: requestId(request),
      });

      response.status(200).json({ data: updated });
    },
  );

  /* ------------------------------------------------------------------- news */

  router.get('/news-categories', requirePermission('news.read'), async (_request, response) => {
    const rows = await prisma.newsCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true },
    });

    response.status(200).json({ data: rows });
  });

  router.post(
    '/news-categories',
    requirePermission('news.create'),
    requireCsrf(),
    async (request, response) => {
      const input = categorySchema.parse(request.body);
      const created = await prisma.newsCategory.create({
        data: { id: uuidv7(), name: input.name, slug: input.slug },
        select: { id: true, name: true, slug: true },
      });

      await audit({
        actorId: actor(request),
        action: 'newsCategory.create',
        entityType: 'NEWS_CATEGORY',
        entityId: created.id,
        requestId: requestId(request),
      });

      response.status(201).json({ data: created });
    },
  );

  router.get('/news', requirePermission('news.read'), async (_request, response) => {
    const rows = await prisma.newsPost.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
        version: true,
        category: { select: { name: true } },
      },
    });

    response.status(200).json({
      data: rows.map((row) => ({
        ...row,
        publishedAt: row.publishedAt?.toISOString() ?? null,
        updatedAt: row.updatedAt.toISOString(),
      })),
    });
  });

  router.get('/news/:id', requirePermission('news.read'), async (request, response) => {
    const row = await prisma.newsPost.findFirst({
      where: { id: String(request.params.id), deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        body: true,
        categoryId: true,
        attributionName: true,
        readingMinutes: true,
        status: true,
        version: true,
        seoTitle: true,
        seoDescription: true,
        noindex: true,
      },
    });

    if (row === null) throw new NotFoundError('Article not found');

    response.status(200).json({
      data: {
        ...row,
        body: (row.body as { paragraphs?: string[] }).paragraphs?.join('\n\n') ?? '',
      },
    });
  });

  router.post(
    '/news',
    requirePermission('news.create'),
    requireCsrf(),
    async (request, response) => {
      const input = newsSchema.parse(request.body);
      const created = await prisma.newsPost.create({
        data: {
          id: uuidv7(),
          title: input.title,
          slug: input.slug,
          excerpt: input.excerpt,
          body: paragraphs(input.body),
          categoryId: input.categoryId,
          attributionName: input.attributionName,
          readingMinutes: input.readingMinutes,
          seoTitle: input.seoTitle,
          seoDescription: input.seoDescription,
          noindex: input.noindex,
          createdById: actor(request),
        },
        select: { id: true, slug: true, status: true, version: true },
      });

      await audit({
        actorId: actor(request),
        action: 'news.create',
        entityType: 'NEWS',
        entityId: created.id,
        requestId: requestId(request),
      });

      response.status(201).json({ data: created });
    },
  );

  router.put(
    '/news/:id',
    requirePermission('news.update'),
    requireCsrf(),
    async (request, response) => {
      const input = newsSchema.parse(request.body);
      const current = await prisma.newsPost.findFirst({
        where: { id: String(request.params.id), deletedAt: null },
        select: { id: true, version: true },
      });

      if (current === null) throw new NotFoundError('Article not found');
      if (current.version !== input.version) {
        throw new AppError('VERSION_CONFLICT', 409, 'This article changed since it was opened');
      }

      const updated = await prisma.newsPost.update({
        where: { id: current.id },
        data: {
          title: input.title,
          slug: input.slug,
          excerpt: input.excerpt,
          body: paragraphs(input.body),
          categoryId: input.categoryId,
          attributionName: input.attributionName,
          readingMinutes: input.readingMinutes,
          seoTitle: input.seoTitle,
          seoDescription: input.seoDescription,
          noindex: input.noindex,
          version: { increment: 1 },
          updatedById: actor(request),
        },
        select: { id: true, slug: true, status: true, version: true },
      });

      await audit({
        actorId: actor(request),
        action: 'news.update',
        entityType: 'NEWS',
        entityId: updated.id,
        requestId: requestId(request),
      });

      response.status(200).json({ data: updated });
    },
  );

  router.post(
    '/news/:id/status',
    requirePermission('news.publish', 'news.update'),
    requireCsrf(),
    async (request, response) => {
      const { action, scheduledFor } = statusSchema.parse(request.body);
      const current = await prisma.newsPost.findFirst({
        where: { id: String(request.params.id), deletedAt: null },
        select: { id: true, status: true },
      });

      if (current === null) throw new NotFoundError('Article not found');

      if (action === 'publish') {
        await publishEntity(prisma, 'NEWS', current.id, { actorId: actor(request) });
        const published = await prisma.newsPost.findUniqueOrThrow({
          where: { id: current.id },
          select: { id: true, slug: true, status: true, version: true },
        });

        await audit({
          actorId: actor(request),
          action: 'news.publish',
          entityType: 'NEWS',
          entityId: published.id,
          before: { status: current.status },
          after: { status: published.status },
          requestId: requestId(request),
        });

        response.status(200).json({ data: published });
        return;
      }

      const data = transitionData(action, current.status, scheduledFor, actor(request), new Date());
      const updated = await prisma.newsPost.update({
        where: { id: current.id },
        data: { ...data, version: { increment: 1 } },
        select: { id: true, slug: true, status: true, version: true },
      });

      await audit({
        actorId: actor(request),
        action: `news.${action}`,
        entityType: 'NEWS',
        entityId: updated.id,
        before: { status: current.status },
        after: { status: updated.status },
        requestId: requestId(request),
      });

      response.status(200).json({ data: updated });
    },
  );

  /* --------------------------------------------------------------- previews */

  router.get(
    '/activities/:id/preview',
    requirePermission('activity.read'),
    async (request, response) => {
      const row = await prisma.activity.findFirst({
        where: { id: String(request.params.id), deletedAt: null },
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          body: true,
          status: true,
          version: true,
        },
      });

      if (row === null) throw new NotFoundError('Activity not found');

      response
        .setHeader('Cache-Control', 'no-store, private')
        .status(200)
        .json({
          data: {
            ...row,
            body: (row.body as { paragraphs?: string[] } | null)?.paragraphs ?? [],
            preview: true,
          },
        });
    },
  );

  router.get('/events/:id/preview', requirePermission('event.read'), async (request, response) => {
    const row = await prisma.event.findFirst({
      where: { id: String(request.params.id), deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        startAt: true,
        endAt: true,
        venueName: true,
        status: true,
        version: true,
      },
    });

    if (row === null) throw new NotFoundError('Event not found');

    response
      .setHeader('Cache-Control', 'no-store, private')
      .status(200)
      .json({
        data: {
          ...row,
          description: (row.description as { paragraphs?: string[] }).paragraphs ?? [],
          startAt: row.startAt.toISOString(),
          endAt: row.endAt?.toISOString() ?? null,
          preview: true,
        },
      });
  });

  router.get('/news/:id/preview', requirePermission('news.read'), async (request, response) => {
    const row = await prisma.newsPost.findFirst({
      where: { id: String(request.params.id), deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        body: true,
        status: true,
        version: true,
      },
    });

    if (row === null) throw new NotFoundError('Article not found');

    response
      .setHeader('Cache-Control', 'no-store, private')
      .status(200)
      .json({
        data: {
          ...row,
          body: (row.body as { paragraphs?: string[] }).paragraphs ?? [],
          preview: true,
        },
      });
  });

  return router;
}
