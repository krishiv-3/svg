import express, { type Router } from 'express';
import { z } from 'zod';

import { uuidv7 } from '@gaushala/shared';

import type { PrismaClient } from '../../generated/prisma/client.js';

import { AppError, NotFoundError } from '../../core/http/errors.js';
import { requireCsrf, requirePermission } from '../../core/auth/middleware.js';

/**
 * Batch 2 administration: testimonials, impact statistics, enquiries,
 * administrator accounts and site settings.
 *
 * Same conventions as the content modules: explicit guards per route, CSRF on
 * every mutation, audit entries, and transitions validated before the database
 * sees them.
 */

const slugDate = z.iso.date();

const testimonialSchema = z.object({
  displayName: z.string().min(2).max(120),
  location: z.string().max(120).nullable(),
  body: z.string().min(20).max(4000),
  consentEvidence: z.string().min(10).max(300),
  consentDate: slugDate,
  displayOrder: z.number().int().min(0).max(10_000),
  mediaId: z.uuid().nullable(),
});

const impactSchema = z.object({
  label: z.string().min(2).max(120),
  value: z.number().min(0).max(1_000_000_000),
  unit: z.string().max(40).nullable(),
  methodology: z.string().min(10).max(2000),
  sourceNote: z.string().max(300).nullable(),
  periodLabel: z.string().max(80).nullable(),
  displayOrder: z.number().int().min(0).max(10_000),
});

const ENQUIRY_TRANSITIONS: Record<string, readonly string[]> = {
  NEW: ['IN_PROGRESS', 'RESOLVED', 'SPAM', 'ARCHIVED'],
  IN_PROGRESS: ['RESOLVED', 'SPAM', 'ARCHIVED'],
  RESOLVED: ['IN_PROGRESS', 'ARCHIVED'],
  SPAM: ['ARCHIVED'],
  ARCHIVED: [],
};

const USER_STATUSES = ['INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED'] as const;

/** Settings groups map to the permissions the catalogue already defines. */
const SETTING_PERMISSIONS: Record<string, { read: string; update: string }> = {
  site: { read: 'settings.general.read', update: 'settings.general.update' },
  contact: { read: 'settings.contact.read', update: 'settings.contact.update' },
  seo: { read: 'settings.general.read', update: 'settings.general.update' },
  donation: { read: 'settings.donation.read', update: 'settings.donation.update' },
};

function settingsPermissions(key: string): { read: string; update: string } {
  const group = key.split('.')[0] ?? '';
  return (
    SETTING_PERMISSIONS[group] ??
    SETTING_PERMISSIONS['site'] ?? {
      read: 'settings.general.read',
      update: 'settings.general.update',
    }
  );
}

/** Reject non-http(s) URLs anywhere in a settings value. */
function assertSafeUrls(value: unknown, path = 'value'): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertSafeUrls(entry, `${path}[${String(index)}]`));
    return;
  }

  if (value === null || typeof value !== 'object') return;

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const here = `${path}.${key}`;

    if (typeof entry === 'string' && /url$/i.test(key) && entry.trim() !== '') {
      try {
        const parsed = new URL(entry);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
          throw new AppError('VALIDATION_FAILED', 422, `${here} must be an http(s) URL`);
        }
      } catch {
        throw new AppError('VALIDATION_FAILED', 422, `${here} must be an http(s) URL`);
      }
    }

    assertSafeUrls(entry, here);
  }
}

export interface Batch2Dependencies {
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

export function createBatch2Router({ prisma, audit }: Batch2Dependencies): Router {
  const router = express.Router();
  const actor = (request: express.Request): string | null => request.admin?.userId ?? null;
  const reqId = (request: express.Request): string | null =>
    typeof request.id === 'string' ? request.id : null;

  const toTestimonial = (row: {
    id: string;
    displayName: string;
    location: string | null;
    body: string;
    consentEvidence: string;
    consentDate: Date;
    approvalStatus: string;
    approvedAt: Date | null;
    isVisible: boolean;
    displayOrder: number;
    mediaId: string | null;
    deletedAt: Date | null;
    updatedAt: Date;
  }) => ({
    ...row,
    consentDate: row.consentDate.toISOString().slice(0, 10),
    approvedAt: row.approvedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
    isArchived: row.deletedAt !== null,
  });

  /* ------------------------------------------------------------ testimonials */

  router.get('/testimonials', requirePermission('testimonial.read'), async (request, response) => {
    const q = typeof request.query.q === 'string' ? request.query.q.trim() : '';
    const includeArchived = request.query.archived === 'true';

    const rows = await prisma.testimonial.findMany({
      where: {
        ...(includeArchived ? {} : { deletedAt: null }),
        ...(q === ''
          ? {}
          : {
              OR: [
                { displayName: { contains: q, mode: 'insensitive' as const } },
                { body: { contains: q, mode: 'insensitive' as const } },
              ],
            }),
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });

    response.status(200).json({ data: rows.map(toTestimonial) });
  });

  router.get(
    '/testimonials/:id',
    requirePermission('testimonial.read'),
    async (request, response) => {
      const row = await prisma.testimonial.findFirst({ where: { id: String(request.params.id) } });
      if (row === null) throw new NotFoundError('Testimonial not found');
      response.status(200).json({ data: toTestimonial(row) });
    },
  );

  router.post(
    '/testimonials',
    requirePermission('testimonial.create'),
    requireCsrf(),
    async (request, response) => {
      const input = testimonialSchema.parse(request.body);

      const created = await prisma.testimonial.create({
        data: {
          id: uuidv7(),
          displayName: input.displayName,
          location: input.location,
          body: input.body,
          consentEvidence: input.consentEvidence,
          consentDate: new Date(input.consentDate),
          displayOrder: input.displayOrder,
          mediaId: input.mediaId,
          approvalStatus: 'PENDING',
          isVisible: false,
        },
      });

      await audit({
        actorId: actor(request),
        action: 'testimonial.create',
        entityType: 'TESTIMONIAL',
        entityId: created.id,
        requestId: reqId(request),
      });

      response.status(201).json({ data: toTestimonial(created) });
    },
  );

  router.put(
    '/testimonials/:id',
    requirePermission('testimonial.update'),
    requireCsrf(),
    async (request, response) => {
      const input = testimonialSchema.parse(request.body);
      const current = await prisma.testimonial.findFirst({
        where: { id: String(request.params.id), deletedAt: null },
      });

      if (current === null) throw new NotFoundError('Testimonial not found');

      const updated = await prisma.testimonial.update({
        where: { id: current.id },
        data: {
          displayName: input.displayName,
          location: input.location,
          body: input.body,
          consentEvidence: input.consentEvidence,
          consentDate: new Date(input.consentDate),
          displayOrder: input.displayOrder,
          mediaId: input.mediaId,
        },
      });

      await audit({
        actorId: actor(request),
        action: 'testimonial.update',
        entityType: 'TESTIMONIAL',
        entityId: updated.id,
        requestId: reqId(request),
      });

      response.status(200).json({ data: toTestimonial(updated) });
    },
  );

  router.post(
    '/testimonials/:id/approval',
    requirePermission('testimonial.update'),
    requireCsrf(),
    async (request, response) => {
      const { action } = z
        .object({ action: z.enum(['approve', 'reject', 'reset']) })
        .parse(request.body);
      const current = await prisma.testimonial.findFirst({
        where: { id: String(request.params.id), deletedAt: null },
        select: { id: true, approvalStatus: true, consentEvidence: true, consentDate: true },
      });

      if (current === null) throw new NotFoundError('Testimonial not found');

      const approved = action === 'approve';

      if (approved && current.consentEvidence.trim() === '') {
        throw new AppError(
          'INVALID_STATE_TRANSITION',
          409,
          'A testimonial cannot be approved without consent evidence',
        );
      }

      const updated = await prisma.testimonial.update({
        where: { id: current.id },
        data: approved
          ? { approvalStatus: 'APPROVED', approvedById: actor(request), approvedAt: new Date() }
          : {
              approvalStatus: action === 'reject' ? 'REJECTED' : 'PENDING',
              approvedById: null,
              approvedAt: null,
              isVisible: false,
            },
      });

      await audit({
        actorId: actor(request),
        action: `testimonial.${action}`,
        entityType: 'TESTIMONIAL',
        entityId: updated.id,
        before: { approvalStatus: current.approvalStatus },
        after: { approvalStatus: updated.approvalStatus },
        requestId: reqId(request),
      });

      response.status(200).json({ data: toTestimonial(updated) });
    },
  );

  router.post(
    '/testimonials/:id/visibility',
    requirePermission('testimonial.update'),
    requireCsrf(),
    async (request, response) => {
      const { visible } = z.object({ visible: z.boolean() }).parse(request.body);
      const current = await prisma.testimonial.findFirst({
        where: { id: String(request.params.id), deletedAt: null },
      });

      if (current === null) throw new NotFoundError('Testimonial not found');

      // Publication rule: approved consent, recorded, and not archived.
      if (visible) {
        if (current.approvalStatus !== 'APPROVED') {
          throw new AppError(
            'INVALID_STATE_TRANSITION',
            409,
            'Approve the testimonial before publishing it',
          );
        }

        if (current.consentEvidence.trim() === '') {
          throw new AppError(
            'INVALID_STATE_TRANSITION',
            409,
            'Consent evidence is required before publication',
          );
        }
      }

      const updated = await prisma.testimonial.update({
        where: { id: current.id },
        data: { isVisible: visible },
      });

      await audit({
        actorId: actor(request),
        action: visible ? 'testimonial.publish' : 'testimonial.unpublish',
        entityType: 'TESTIMONIAL',
        entityId: updated.id,
        after: { isVisible: updated.isVisible },
        requestId: reqId(request),
      });

      response.status(200).json({ data: toTestimonial(updated) });
    },
  );

  router.post(
    '/testimonials/:id/archive',
    requirePermission('testimonial.update'),
    requireCsrf(),
    async (request, response) => {
      const { archived } = z.object({ archived: z.boolean() }).parse(request.body);
      const updated = await prisma.testimonial.updateMany({
        where: { id: String(request.params.id) },
        data: {
          deletedAt: archived ? new Date() : null,
          ...(archived ? { isVisible: false } : {}),
        },
      });

      if (updated.count === 0) throw new NotFoundError('Testimonial not found');

      await audit({
        actorId: actor(request),
        action: archived ? 'testimonial.archive' : 'testimonial.restore',
        entityType: 'TESTIMONIAL',
        entityId: String(request.params.id),
        requestId: reqId(request),
      });

      response.status(200).json({ data: { archived } });
    },
  );

  /* ---------------------------------------------------------------- impact */

  router.get('/impact', requirePermission('impact.read'), async (_request, response) => {
    const rows = await prisma.impactStat.findMany({
      where: { deletedAt: null },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });

    response.status(200).json({
      data: rows.map((row) => ({
        ...row,
        value: Number(row.value),
        verifiedAt: row.verifiedAt?.toISOString() ?? null,
        updatedAt: row.updatedAt.toISOString(),
      })),
    });
  });

  router.post(
    '/impact',
    requirePermission('impact.create'),
    requireCsrf(),
    async (request, response) => {
      const input = impactSchema.parse(request.body);

      const created = await prisma.impactStat.create({
        data: {
          id: uuidv7(),
          label: input.label,
          value: input.value,
          unit: input.unit,
          methodology: input.methodology,
          sourceNote: input.sourceNote,
          periodLabel: input.periodLabel,
          displayOrder: input.displayOrder,
          verificationStatus: 'DRAFT',
          isVisible: false,
        },
      });

      await audit({
        actorId: actor(request),
        action: 'impact.create',
        entityType: 'IMPACT_STAT',
        entityId: created.id,
        requestId: reqId(request),
      });

      response.status(201).json({ data: { ...created, value: Number(created.value) } });
    },
  );

  router.put(
    '/impact/:id',
    requirePermission('impact.update'),
    requireCsrf(),
    async (request, response) => {
      const input = impactSchema.parse(request.body);
      const current = await prisma.impactStat.findFirst({
        where: { id: String(request.params.id), deletedAt: null },
        select: { id: true },
      });

      if (current === null) throw new NotFoundError('Statistic not found');

      const updated = await prisma.impactStat.update({
        where: { id: current.id },
        data: {
          label: input.label,
          value: input.value,
          unit: input.unit,
          methodology: input.methodology,
          sourceNote: input.sourceNote,
          periodLabel: input.periodLabel,
          displayOrder: input.displayOrder,
          // Editing a verified figure invalidates the verification.
          verificationStatus: 'DRAFT',
          verifiedById: null,
          verifiedAt: null,
          isVisible: false,
        },
      });

      await audit({
        actorId: actor(request),
        action: 'impact.update',
        entityType: 'IMPACT_STAT',
        entityId: updated.id,
        requestId: reqId(request),
      });

      response.status(200).json({ data: { ...updated, value: Number(updated.value) } });
    },
  );

  router.post(
    '/impact/:id/verification',
    requirePermission('impact.update'),
    requireCsrf(),
    async (request, response) => {
      const { verified } = z.object({ verified: z.boolean() }).parse(request.body);
      const current = await prisma.impactStat.findFirst({
        where: { id: String(request.params.id), deletedAt: null },
        select: { id: true, verificationStatus: true, methodology: true },
      });

      if (current === null) throw new NotFoundError('Statistic not found');

      if (verified && current.methodology.trim() === '') {
        throw new AppError(
          'INVALID_STATE_TRANSITION',
          409,
          'Record the methodology before verifying',
        );
      }

      const updated = await prisma.impactStat.update({
        where: { id: current.id },
        data: verified
          ? { verificationStatus: 'VERIFIED', verifiedById: actor(request), verifiedAt: new Date() }
          : { verificationStatus: 'DRAFT', verifiedById: null, verifiedAt: null, isVisible: false },
      });

      await audit({
        actorId: actor(request),
        action: verified ? 'impact.verify' : 'impact.unverify',
        entityType: 'IMPACT_STAT',
        entityId: updated.id,
        before: { verificationStatus: current.verificationStatus },
        after: { verificationStatus: updated.verificationStatus },
        requestId: reqId(request),
      });

      response.status(200).json({ data: { ...updated, value: Number(updated.value) } });
    },
  );

  router.post(
    '/impact/:id/visibility',
    requirePermission('impact.update'),
    requireCsrf(),
    async (request, response) => {
      const { visible } = z.object({ visible: z.boolean() }).parse(request.body);
      const current = await prisma.impactStat.findFirst({
        where: { id: String(request.params.id), deletedAt: null },
        select: { id: true, verificationStatus: true },
      });

      if (current === null) throw new NotFoundError('Statistic not found');

      if (visible && current.verificationStatus !== 'VERIFIED') {
        throw new AppError(
          'INVALID_STATE_TRANSITION',
          409,
          'Only verified statistics can be published',
        );
      }

      const updated = await prisma.impactStat.update({
        where: { id: current.id },
        data: { isVisible: visible },
      });

      await audit({
        actorId: actor(request),
        action: visible ? 'impact.publish' : 'impact.unpublish',
        entityType: 'IMPACT_STAT',
        entityId: updated.id,
        after: { isVisible: updated.isVisible },
        requestId: reqId(request),
      });

      response.status(200).json({ data: { ...updated, value: Number(updated.value) } });
    },
  );

  router.post(
    '/impact/:id/archive',
    requirePermission('impact.update'),
    requireCsrf(),
    async (request, response) => {
      const { archived } = z.object({ archived: z.boolean() }).parse(request.body);
      const result = await prisma.impactStat.updateMany({
        where: { id: String(request.params.id) },
        data: {
          deletedAt: archived ? new Date() : null,
          ...(archived ? { isVisible: false } : {}),
        },
      });

      if (result.count === 0) throw new NotFoundError('Statistic not found');

      await audit({
        actorId: actor(request),
        action: archived ? 'impact.archive' : 'impact.restore',
        entityType: 'IMPACT_STAT',
        entityId: String(request.params.id),
        requestId: reqId(request),
      });

      response.status(200).json({ data: { archived } });
    },
  );

  /* -------------------------------------------------------------- enquiries */

  router.get('/enquiries', requirePermission('enquiry.read'), async (request, response) => {
    const q = typeof request.query.q === 'string' ? request.query.q.trim() : '';
    const status = typeof request.query.status === 'string' ? request.query.status : '';

    const rows = await prisma.enquiry.findMany({
      where: {
        ...(status === '' ? {} : { status: status as 'NEW' }),
        ...(q === ''
          ? {}
          : {
              OR: [
                { name: { contains: q, mode: 'insensitive' as const } },
                { email: { contains: q, mode: 'insensitive' as const } },
                { reference: { contains: q, mode: 'insensitive' as const } },
              ],
            }),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        reference: true,
        type: true,
        name: true,
        email: true,
        subject: true,
        status: true,
        createdAt: true,
        assignedTo: { select: { id: true, name: true } },
      },
    });

    response.status(200).json({
      data: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    });
  });

  router.get('/enquiries/:id', requirePermission('enquiry.read'), async (request, response) => {
    const row = await prisma.enquiry.findUnique({
      where: { id: String(request.params.id) },
      select: {
        id: true,
        reference: true,
        type: true,
        name: true,
        email: true,
        phone: true,
        subject: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        assignedTo: { select: { id: true, name: true } },
        event: { select: { id: true, title: true } },
      },
    });

    if (row === null) throw new NotFoundError('Enquiry not found');

    // Deliberately omitted: ip hash, user agent and spam score â€” not needed to
    // answer the enquiry, and personal data should be minimised.
    response.status(200).json({
      data: {
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    });
  });

  router.post(
    '/enquiries/:id/status',
    requirePermission('enquiry.update'),
    requireCsrf(),
    async (request, response) => {
      const { status } = z
        .object({ status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED', 'SPAM', 'ARCHIVED']) })
        .parse(request.body);

      const current = await prisma.enquiry.findUnique({
        where: { id: String(request.params.id) },
        select: { id: true, status: true },
      });

      if (current === null) throw new NotFoundError('Enquiry not found');

      if (!(ENQUIRY_TRANSITIONS[current.status] ?? []).includes(status)) {
        throw new AppError(
          'INVALID_STATE_TRANSITION',
          409,
          `Cannot move an enquiry from ${current.status} to ${status}`,
        );
      }

      const updated = await prisma.enquiry.update({
        where: { id: current.id },
        data: { status },
        select: { id: true, status: true },
      });

      await audit({
        actorId: actor(request),
        action: 'enquiry.status',
        entityType: 'ENQUIRY',
        entityId: updated.id,
        before: { status: current.status },
        after: { status: updated.status },
        requestId: reqId(request),
      });

      response.status(200).json({ data: updated });
    },
  );

  router.post(
    '/enquiries/:id/assign',
    requirePermission('enquiry.assign'),
    requireCsrf(),
    async (request, response) => {
      const { userId } = z.object({ userId: z.uuid().nullable() }).parse(request.body);

      const current = await prisma.enquiry.findUnique({
        where: { id: String(request.params.id) },
        select: { id: true, assignedToId: true },
      });

      if (current === null) throw new NotFoundError('Enquiry not found');

      if (userId !== null) {
        const user = await prisma.user.findFirst({
          where: { id: userId, deletedAt: null, status: 'ACTIVE' },
          select: { id: true },
        });

        if (user === null) throw new NotFoundError('Administrator not found');
      }

      const updated = await prisma.enquiry.update({
        where: { id: current.id },
        data: { assignedToId: userId },
        select: { id: true, assignedToId: true },
      });

      await audit({
        actorId: actor(request),
        action: 'enquiry.assign',
        entityType: 'ENQUIRY',
        entityId: updated.id,
        before: { assignedToId: current.assignedToId },
        after: { assignedToId: updated.assignedToId },
        requestId: reqId(request),
      });

      response.status(200).json({ data: updated });
    },
  );

  /* ------------------------------------------------------------------ users */

  /** Administrator management is super-admin only until the catalogue gains user keys. */
  const superAdminOnly = requirePermission();

  const toAdmin = (row: {
    id: string;
    email: string;
    name: string;
    status: string;
    isSuperAdmin: boolean;
    mustChangePassword: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    roles: { role: { key: string; name: string } }[];
  }) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    status: row.status,
    isSuperAdmin: row.isSuperAdmin,
    mustChangePassword: row.mustChangePassword,
    lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    roles: row.roles.map((entry) => entry.role),
  });

  const adminSelect = {
    id: true,
    email: true,
    name: true,
    status: true,
    isSuperAdmin: true,
    mustChangePassword: true,
    lastLoginAt: true,
    createdAt: true,
    roles: { select: { role: { select: { key: true, name: true } } } },
  } as const;

  router.get(
    '/users',
    superAdminOnly,
    requirePermission('dashboard.view'),
    async (_request, response) => {
      const rows = await prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: [{ isSuperAdmin: 'desc' }, { createdAt: 'asc' }],
        select: adminSelect,
      });

      const roles = await prisma.role.findMany({
        orderBy: { key: 'asc' },
        select: { key: true, name: true },
      });

      response.status(200).json({ data: { users: rows.map(toAdmin), roles } });
    },
  );

  router.post('/users/invite', superAdminOnly, requireCsrf(), async (request, response) => {
    const input = z
      .object({
        email: z.email().max(254),
        name: z.string().min(2).max(120),
        roleKeys: z.array(z.string().max(60)).min(1).max(4),
      })
      .parse(request.body);

    const email = input.email.trim().toLowerCase();

    const roles = await prisma.role.findMany({
      where: { key: { in: input.roleKeys } },
      select: { id: true, key: true },
    });

    if (roles.length !== input.roleKeys.length) {
      throw new AppError('VALIDATION_FAILED', 422, 'Unknown role in roleKeys');
    }

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });

    if (existing !== null) {
      throw new AppError('VALIDATION_FAILED', 422, 'An account with that email already exists');
    }

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { id: uuidv7(), email, name: input.name, status: 'INVITED', isSuperAdmin: false },
        select: { id: true },
      });

      await tx.userRole.createMany({
        data: roles.map((role) => ({ userId: user.id, roleId: role.id })),
      });

      // Re-read so the response carries the roles just assigned.
      return tx.user.findUniqueOrThrow({ where: { id: user.id }, select: adminSelect });
    });

    await audit({
      actorId: actor(request),
      action: 'user.invite',
      entityType: 'USER',
      entityId: created.id,
      after: { email, roles: input.roleKeys },
      requestId: reqId(request),
    });

    response.status(201).json({ data: toAdmin(created) });
  });

  router.post('/users/:id/roles', superAdminOnly, requireCsrf(), async (request, response) => {
    const { roleKeys } = z
      .object({ roleKeys: z.array(z.string()).min(1).max(4) })
      .parse(request.body);
    const targetId = String(request.params.id);

    const target = await prisma.user.findFirst({
      where: { id: targetId, deletedAt: null },
      select: {
        id: true,
        isSuperAdmin: true,
        roles: { select: { role: { select: { key: true } } } },
      },
    });

    if (target === null) throw new NotFoundError('Administrator not found');

    const roles = await prisma.role.findMany({
      where: { key: { in: roleKeys } },
      select: { id: true, key: true },
    });

    if (roles.length !== roleKeys.length) {
      throw new AppError('VALIDATION_FAILED', 422, 'Unknown role in roleKeys');
    }

    const losesSuperAdmin = target.isSuperAdmin && !roleKeys.includes('super_admin');

    if (losesSuperAdmin) {
      const others = await prisma.user.count({
        where: { isSuperAdmin: true, status: 'ACTIVE', deletedAt: null, id: { not: targetId } },
      });

      if (others === 0) {
        throw new AppError(
          'INVALID_STATE_TRANSITION',
          409,
          'At least one active super administrator must remain',
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: targetId } });
      await tx.userRole.createMany({
        data: roles.map((role) => ({ userId: targetId, roleId: role.id })),
      });
      await tx.user.update({
        where: { id: targetId },
        data: { isSuperAdmin: roleKeys.includes('super_admin') },
      });
    });

    await audit({
      actorId: actor(request),
      action: 'user.roles',
      entityType: 'USER',
      entityId: targetId,
      before: { roles: target.roles.map((entry) => entry.role.key) },
      after: { roles: roleKeys },
      requestId: reqId(request),
    });

    const updated = await prisma.user.findUniqueOrThrow({
      where: { id: targetId },
      select: adminSelect,
    });
    response.status(200).json({ data: toAdmin(updated) });
  });

  router.post('/users/:id/status', superAdminOnly, requireCsrf(), async (request, response) => {
    const { status } = z.object({ status: z.enum(USER_STATUSES) }).parse(request.body);
    const targetId = String(request.params.id);

    if (targetId === actor(request)) {
      throw new AppError(
        'INVALID_STATE_TRANSITION',
        409,
        'You cannot change your own account status',
      );
    }

    const target = await prisma.user.findFirst({
      where: { id: targetId, deletedAt: null },
      select: { id: true, status: true, isSuperAdmin: true },
    });

    if (target === null) throw new NotFoundError('Administrator not found');

    if (target.isSuperAdmin && status !== 'ACTIVE') {
      const others = await prisma.user.count({
        where: { isSuperAdmin: true, status: 'ACTIVE', deletedAt: null, id: { not: targetId } },
      });

      if (others === 0) {
        throw new AppError(
          'INVALID_STATE_TRANSITION',
          409,
          'At least one active super administrator must remain',
        );
      }
    }

    const deactivating = status !== 'ACTIVE';

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: targetId },
        data: { status },
        select: adminSelect,
      });

      if (deactivating) {
        await tx.session.updateMany({
          where: { userId: targetId, revokedAt: null },
          data: { revokedAt: new Date(), revokedReason: 'account_deactivated' },
        });
      }

      return user;
    });

    await audit({
      actorId: actor(request),
      action: deactivating ? 'user.deactivate' : 'user.activate',
      entityType: 'USER',
      entityId: targetId,
      before: { status: target.status },
      after: { status: updated.status },
      requestId: reqId(request),
    });

    response.status(200).json({ data: toAdmin(updated) });
  });

  router.post(
    '/users/:id/revoke-sessions',
    superAdminOnly,
    requireCsrf(),
    async (request, response) => {
      const targetId = String(request.params.id);

      const result = await prisma.session.updateMany({
        where: { userId: targetId, revokedAt: null },
        data: { revokedAt: new Date(), revokedReason: 'admin_revoked' },
      });

      await audit({
        actorId: actor(request),
        action: 'user.revokeSessions',
        entityType: 'USER',
        entityId: targetId,
        after: { revoked: result.count },
        requestId: reqId(request),
      });

      response.status(200).json({ data: { revoked: result.count } });
    },
  );

  /* --------------------------------------------------------------- settings */

  router.get(
    '/settings',
    requirePermission('settings.general.read'),
    async (_request, response) => {
      const rows = await prisma.setting.findMany({
        orderBy: [{ category: 'asc' }, { key: 'asc' }],
      });

      response.status(200).json({
        data: rows.map((row) => ({
          key: row.key,
          category: row.category,
          description: row.description,
          value: row.value,
          updatedAt: row.updatedAt.toISOString(),
        })),
      });
    },
  );

  router.put('/settings/:key', requireCsrf(), async (request, response) => {
    const key = String(request.params.key);
    const permissions = settingsPermissions(key);

    // Permission depends on the group, so it is checked inside the handler.
    const admin = request.admin;
    const allowed =
      admin !== undefined &&
      (admin.isSuperAdmin ||
        admin.permissions.includes('*') ||
        admin.permissions.includes(permissions.update));

    if (!allowed) throw new AppError('FORBIDDEN', 403, 'Permission denied');

    const { value } = z.object({ value: z.record(z.string(), z.unknown()) }).parse(request.body);
    assertSafeUrls(value);

    const existing = await prisma.setting.findUnique({
      where: { key },
      select: { key: true, value: true },
    });

    if (existing === null) throw new NotFoundError('Setting not found');

    const updated = await prisma.setting.update({
      where: { key },
      data: { value: value as object },
      select: { key: true, category: true, value: true, updatedAt: true },
    });

    await audit({
      actorId: actor(request),
      action: 'settings.update',
      entityType: 'SETTING',
      // audit_logs.entity_id is a UUID column; the setting key travels in the
      // payload instead of being forced into it.
      entityId: null,
      before: { key, value: existing.value },
      after: { key, value },
      requestId: reqId(request),
    });

    response.status(200).json({ data: { ...updated, updatedAt: updated.updatedAt.toISOString() } });
  });

  return router;
}
