import { uuidv7 } from '@gaushala/shared';

import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';

/**
 * Publishing and scheduled publication for every content type.
 *
 * All four kinds share the same rules: supersede the previous published
 * revision, write an immutable snapshot, flip the row to PUBLISHED — in one
 * transaction — and only publish content whose scheduled time has passed.
 */

type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export type PublishableType = 'CAMPAIGN' | 'ACTIVITY' | 'EVENT' | 'NEWS';

export interface PublishOptions {
  readonly actorId: string | null;
  readonly now?: Date;
}

/**
 * Deterministic serialisation of a snapshot for comparison.
 *
 * JSON.stringify is order-sensitive, so two logically identical snapshots would
 * compare unequal; keys are sorted at every level and `undefined` is dropped,
 * matching how the value is stored.
 */
function canonical(value: unknown): string {
  if (value === null || value === undefined) return 'null';

  if (Array.isArray(value)) {
    return `[${value.map((entry: unknown) => canonical(entry)).join(',')}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));

    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
      .join(',')}}`;
  }

  return JSON.stringify(value) ?? 'null';
}

/** Snapshot payload differs per type; the revision row shape does not. */
async function writeSnapshot(
  tx: TransactionClient,
  entityType: PublishableType,
  entityId: string,
  snapshot: Prisma.InputJsonObject,
  options: PublishOptions,
): Promise<void> {
  const current = await tx.revision.findFirst({
    where: { entityType, entityId, status: 'PUBLISHED' },
    orderBy: { version: 'desc' },
    select: { snapshot: true },
  });

  // Republishing unchanged content must not grow the history. The existing
  // PUBLISHED revision stays live; nothing is superseded and no version is
  // consumed. The entity row is already locked by this transaction, so a
  // concurrent publisher sees the committed state rather than racing us.
  if (current !== null && canonical(current.snapshot) === canonical(snapshot)) {
    return;
  }

  await tx.revision.updateMany({
    where: { entityType, entityId, status: 'PUBLISHED' },
    data: { status: 'SUPERSEDED' },
  });

  const highest = await tx.revision.aggregate({
    where: { entityType, entityId },
    _max: { version: true },
  });

  await tx.revision.create({
    data: {
      id: uuidv7(),
      entityType,
      entityId,
      version: (highest._max.version ?? 0) + 1,
      status: 'PUBLISHED',
      publishedAt: options.now ?? new Date(),
      createdById: options.actorId,
      snapshot,
    },
  });
}

const publishFields = (options: PublishOptions) => ({
  status: 'PUBLISHED' as const,
  publishedAt: options.now ?? new Date(),
  unpublishedAt: null,
  scheduledFor: null,
  version: { increment: 1 },
  updatedById: options.actorId,
});

/** Publish one row of any content type. The caller checks state transitions. */
export async function publishEntity(
  prisma: PrismaClient,
  entityType: PublishableType,
  entityId: string,
  options: PublishOptions,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    if (entityType === 'CAMPAIGN') {
      const row = await tx.campaign.update({
        where: { id: entityId },
        data: publishFields(options),
        select: {
          name: true,
          slug: true,
          purposeSummary: true,
          story: true,
          targetAmountMinor: true,
          manualRaisedMinor: true,
          progressSource: true,
          publishedAt: true,
        },
      });

      await writeSnapshot(
        tx,
        'CAMPAIGN',
        entityId,
        {
          name: row.name,
          slug: row.slug,
          purposeSummary: row.purposeSummary,
          story: row.story,
          targetAmountMinor: row.targetAmountMinor?.toString() ?? null,
          manualRaisedMinor: row.manualRaisedMinor?.toString() ?? null,
          progressSource: row.progressSource,
        },
        options,
      );
      return;
    }

    if (entityType === 'ACTIVITY') {
      const row = await tx.activity.update({
        where: { id: entityId },
        data: publishFields(options),
        select: {
          title: true,
          slug: true,
          shortDescription: true,
          body: true,
          isFeatured: true,
        },
      });

      await writeSnapshot(
        tx,
        'ACTIVITY',
        entityId,
        {
          title: row.title,
          slug: row.slug,
          shortDescription: row.shortDescription,
          body: row.body,
        },
        options,
      );
      return;
    }

    if (entityType === 'EVENT') {
      const row = await tx.event.update({
        where: { id: entityId },
        data: publishFields(options),
        select: {
          title: true,
          slug: true,
          description: true,
          startAt: true,
          endAt: true,
          venueName: true,
        },
      });

      await writeSnapshot(
        tx,
        'EVENT',
        entityId,
        {
          title: row.title,
          slug: row.slug,
          description: row.description,
          startAt: row.startAt.toISOString(),
          endAt: row.endAt?.toISOString() ?? null,
          venueName: row.venueName,
        },
        options,
      );
      return;
    }

    const row = await tx.newsPost.update({
      where: { id: entityId },
      data: publishFields(options),
      select: { title: true, slug: true, excerpt: true, body: true, categoryId: true },
    });

    await writeSnapshot(
      tx,
      'NEWS',
      entityId,
      {
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt,
        body: row.body,
        categoryId: row.categoryId,
      },
      options,
    );
  });
}

interface DueItem {
  readonly id: string;
  readonly type: PublishableType;
}

export interface SweepResult {
  readonly published: number;
  readonly failed: number;
}

/**
 * Publish everything whose scheduled time has passed.
 *
 * Idempotent and safe with overlapping runs or multiple API instances: each row
 * is re-checked inside its transaction with the same predicate, so a row is
 * published once even if two sweeps pick it up. A failure is logged and skipped
 * so one bad row cannot stop the rest.
 */
export async function publishDueContent(
  prisma: PrismaClient,
  logger: { error: (obj: unknown, message: string) => void },
  now: Date = new Date(),
): Promise<SweepResult> {
  const due: Date = now;
  const predicate = { status: 'SCHEDULED' as const, scheduledFor: { lte: due }, deletedAt: null };

  const [campaigns, activities, events, news] = await Promise.all([
    prisma.campaign.findMany({ where: predicate, select: { id: true } }),
    prisma.activity.findMany({ where: predicate, select: { id: true } }),
    prisma.event.findMany({ where: predicate, select: { id: true } }),
    prisma.newsPost.findMany({ where: predicate, select: { id: true } }),
  ]);

  const items: DueItem[] = [
    ...campaigns.map((row) => ({ id: row.id, type: 'CAMPAIGN' as const })),
    ...activities.map((row) => ({ id: row.id, type: 'ACTIVITY' as const })),
    ...events.map((row) => ({ id: row.id, type: 'EVENT' as const })),
    ...news.map((row) => ({ id: row.id, type: 'NEWS' as const })),
  ];

  let published = 0;
  let failed = 0;

  for (const item of items) {
    try {
      if (await publishIfStillDue(prisma, item, due)) published += 1;
    } catch (error) {
      failed += 1;
      logger.error(
        { err: error, entityId: item.id, entityType: item.type },
        'scheduled publish failed',
      );
    }
  }

  return { published, failed };
}

async function publishIfStillDue(prisma: PrismaClient, item: DueItem, now: Date): Promise<boolean> {
  const stillDue = await prisma.$transaction(async (tx) => {
    const where = {
      id: item.id,
      status: 'SCHEDULED' as const,
      scheduledFor: { lte: now },
      deletedAt: null,
    };
    const found =
      item.type === 'CAMPAIGN'
        ? await tx.campaign.findFirst({ where, select: { id: true } })
        : item.type === 'ACTIVITY'
          ? await tx.activity.findFirst({ where, select: { id: true } })
          : item.type === 'EVENT'
            ? await tx.event.findFirst({ where, select: { id: true } })
            : await tx.newsPost.findFirst({ where, select: { id: true } });

    return found !== null;
  });

  if (!stillDue) return false;

  await publishEntity(prisma, item.type, item.id, { actorId: null, now });
  return true;
}

/** Backwards-compatible wrapper used by existing tests and callers. */
export async function publishDueCampaigns(
  prisma: PrismaClient,
  logger: { error: (obj: unknown, message: string) => void },
  now: Date = new Date(),
): Promise<number> {
  const result = await publishDueContent(prisma, logger, now);
  return result.published;
}

export function startScheduler(
  prisma: PrismaClient,
  logger: {
    error: (obj: unknown, message: string) => void;
    info?: (obj: unknown, message: string) => void;
  },
  intervalMs = 60_000,
): () => void {
  let running = false;

  const tick = (): void => {
    if (running) return;
    running = true;

    void publishDueContent(prisma, logger)
      .then((result) => {
        if (result.published > 0 || result.failed > 0)
          logger.info?.({ ...result }, 'scheduled sweep');
      })
      .catch((error: unknown) => {
        logger.error({ err: error }, 'scheduler tick failed');
      })
      .finally(() => {
        running = false;
      });
  };

  const timer = setInterval(tick, intervalMs);
  timer.unref();

  return () => {
    clearInterval(timer);
  };
}
