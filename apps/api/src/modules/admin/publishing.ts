import { uuidv7 } from '@gaushala/shared';

import type { PrismaClient } from '../../generated/prisma/client.js';

/**
 * Publishing a campaign.
 *
 * One transaction: the previous published revision is superseded, an immutable
 * snapshot of the new state is written, and the campaign row is flipped to
 * PUBLISHED. Either the public site and the revision history agree, or neither
 * changed.
 */

type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export interface PublishOptions {
  readonly actorId: string | null;
  readonly now?: Date;
}

async function writeRevision(tx: TransactionClient, campaignId: string, options: PublishOptions) {
  const now = options.now ?? new Date();

  await tx.revision.updateMany({
    where: { entityType: 'CAMPAIGN', entityId: campaignId, status: 'PUBLISHED' },
    data: { status: 'SUPERSEDED' },
  });

  const highest = await tx.revision.aggregate({
    where: { entityType: 'CAMPAIGN', entityId: campaignId },
    _max: { version: true },
  });

  const row = await tx.campaign.update({
    where: { id: campaignId },
    data: {
      status: 'PUBLISHED',
      publishedAt: now,
      unpublishedAt: null,
      scheduledFor: null,
      version: { increment: 1 },
      updatedById: options.actorId,
    },
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

  await tx.revision.create({
    data: {
      id: uuidv7(),
      entityType: 'CAMPAIGN',
      entityId: campaignId,
      version: (highest._max.version ?? 0) + 1,
      status: 'PUBLISHED',
      publishedAt: now,
      createdById: options.actorId,
      snapshot: {
        name: row.name,
        slug: row.slug,
        purposeSummary: row.purposeSummary,
        story: row.story,
        targetAmountMinor: row.targetAmountMinor?.toString() ?? null,
        manualRaisedMinor: row.manualRaisedMinor?.toString() ?? null,
        progressSource: row.progressSource,
        publishedAt: row.publishedAt?.toISOString() ?? null,
      },
    },
  });

  return row;
}

/** Publish now, regardless of current state. The caller checks transitions. */
export async function publishCampaign(
  prisma: PrismaClient,
  campaignId: string,
  options: PublishOptions,
) {
  return prisma.$transaction(async (tx) => writeRevision(tx, campaignId, options));
}

/**
 * Publish every campaign whose scheduled time has passed.
 *
 * Idempotent: the campaign is re-read inside the transaction with the same
 * predicate, so a concurrent run (another instance, or a retry) publishes it
 * once. Failures are logged and leave the row untouched for the next tick.
 */
export async function publishDueCampaigns(
  prisma: PrismaClient,
  logger: { error: (obj: unknown, message: string) => void },
  now: Date = new Date(),
): Promise<number> {
  const due = await prisma.campaign.findMany({
    where: { status: 'SCHEDULED', scheduledFor: { lte: now }, deletedAt: null },
    select: { id: true },
  });

  let published = 0;

  for (const candidate of due) {
    try {
      const didPublish = await prisma.$transaction(async (tx) => {
        const locked = await tx.campaign.findFirst({
          where: {
            id: candidate.id,
            status: 'SCHEDULED',
            scheduledFor: { lte: now },
            deletedAt: null,
          },
          select: { id: true },
        });

        if (locked === null) return false;

        await writeRevision(tx, locked.id, { actorId: null, now });
        return true;
      });

      if (didPublish) published += 1;
    } catch (error) {
      logger.error({ err: error, campaignId: candidate.id }, 'scheduled publish failed');
    }
  }

  return published;
}

/**
 * In-process scheduler.
 *
 * A cron or queue would be overkill for a single API instance and a handful of
 * scheduled campaigns; this is a plain interval whose failures are contained.
 */
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

    void publishDueCampaigns(prisma, logger)
      .then((count) => {
        if (count > 0) logger.info?.({ count }, 'scheduled campaigns published');
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
