import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui';
import { adminGet } from '@/lib/admin';

export const dynamic = 'force-dynamic';

interface PreviewCampaign {
  id: string;
  name: string;
  slug: string;
  status: string;
  purposeSummary: string;
  targetAmountMinor: number | null;
  manualRaisedMinor: number | null;
  publishedAt: string | null;
  scheduledFor: string | null;
  story: readonly string[];
}

const inr = (minor: number | null): string =>
  minor === null
    ? 'No goal set'
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(minor / 100);

/**
 * Draft preview.
 *
 * Reads the authenticated preview endpoint, so it works for any status and never
 * exposes the draft publicly. The banner states plainly that this is not the
 * live page.
 */
export default async function CampaignPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await adminGet<PreviewCampaign & { manualRaisedNote: string | null }>(
    `/campaigns/${id}/preview`,
  );

  if (campaign === null) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-terracotta/40 bg-terracotta/10 px-4 py-3">
        <p className="text-[length:var(--text-label)] font-medium text-terracotta-ink">
          Preview — this is not the public page. Status: {campaign.status}
        </p>
        <Link
          href={`/admin/campaigns/${campaign.id}`}
          className="text-[length:var(--text-label)] text-terracotta-ink underline"
        >
          Back to editor
        </Link>
      </div>

      <article className="flex flex-col gap-4 rounded-2xl border border-sand bg-white p-6 shadow-soft">
        <Badge tone="neutral" size="sm">
          {campaign.status}
        </Badge>
        <h1 className="text-title text-cocoa">{campaign.name}</h1>
        <p className="text-body text-charcoal/85">{campaign.purposeSummary}</p>

        <dl className="grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-[length:var(--text-caption)] uppercase text-muted">Target</dt>
            <dd className="text-[length:var(--text-label)] font-medium text-cocoa">
              {inr(campaign.targetAmountMinor)}
            </dd>
          </div>
          <div>
            <dt className="text-[length:var(--text-caption)] uppercase text-muted">Raised</dt>
            <dd className="text-[length:var(--text-label)] font-medium text-cocoa">
              {inr(campaign.manualRaisedMinor)}
            </dd>
          </div>
          <div>
            <dt className="text-[length:var(--text-caption)] uppercase text-muted">Scheduled</dt>
            <dd className="text-[length:var(--text-label)] font-medium text-cocoa">
              {campaign.scheduledFor === null ? '—' : campaign.scheduledFor.slice(0, 16)}
            </dd>
          </div>
        </dl>

        <div className="flex flex-col gap-3 border-t border-sand pt-4">
          {campaign.story.map((paragraph, index) => (
            <p key={index} className="text-body text-charcoal/85">
              {paragraph}
            </p>
          ))}
        </div>
      </article>

      <p className="text-[length:var(--text-caption)] text-muted">
        Public URL once published: /campaigns/{campaign.slug}
      </p>
    </div>
  );
}
