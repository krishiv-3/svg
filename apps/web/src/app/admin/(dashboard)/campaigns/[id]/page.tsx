import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui';
import { adminGet } from '@/lib/admin';

import { CampaignForm, type CampaignFormValues } from '../campaign-form';

export const dynamic = 'force-dynamic';

interface AdminCampaignDetail extends CampaignFormValues {
  id: string;
  version: number;
  status: string;
  publishedAt: string | null;
}

const rupees = (minor: number | null): string => (minor === null ? '' : String(minor / 100));

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await adminGet<
    AdminCampaignDetail & {
      targetAmountMinor: number | null;
      manualRaisedMinor: number | null;
      seoTitle: string | null;
      seoDescription: string | null;
      story: string;
    }
  >(`/campaigns/${id}`);

  if (campaign === null) notFound();

  const revisions = await adminGet<
    {
      id: string;
      version: number;
      status: string;
      createdAt: string;
      publishedAt: string | null;
    }[]
  >(`/campaigns/${id}/revisions`);

  const initial: CampaignFormValues = {
    id: campaign.id,
    version: campaign.version,
    name: campaign.name,
    slug: campaign.slug,
    purposeSummary: campaign.purposeSummary,
    story: campaign.story,
    targetRupees: rupees(campaign.targetAmountMinor),
    manualRaisedRupees: rupees(campaign.manualRaisedMinor),
    manualRaisedNote: campaign.manualRaisedNote ?? '',
    progressSource: campaign.progressSource,
    startDate: campaign.startDate.slice(0, 10),
    endDate: campaign.endDate === null ? '' : campaign.endDate.slice(0, 10),
    isFeatured: campaign.isFeatured,
    acceptsDonations: campaign.acceptsDonations,
    seoTitle: campaign.seoTitle ?? '',
    seoDescription: campaign.seoDescription ?? '',
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/admin/campaigns"
          className="text-[length:var(--text-label)] text-terracotta-ink hover:underline"
        >
          ← Campaigns
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-title text-cocoa">{campaign.name}</h1>
          <Badge tone={campaign.status === 'PUBLISHED' ? 'success' : 'neutral'} size="sm">
            {campaign.status}
          </Badge>
        </div>
        <p className="text-[length:var(--text-caption)] text-muted">
          Version {campaign.version}
          {campaign.publishedAt === null ? '' : ` · published ${campaign.publishedAt.slice(0, 10)}`}
          {' · '}
          <a href={`/campaigns/${campaign.slug}`} className="underline">
            view public page
          </a>
        </p>
      </header>

      <div className="rounded-2xl border border-sand bg-white p-5 shadow-soft sm:p-6">
        <CampaignForm mode="edit" initial={initial} />
      </div>

      <section className="rounded-2xl border border-sand bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-subheading text-cocoa">Revision history</h2>
          <Link
            href={`/admin/campaigns/${campaign.id}/preview`}
            className="text-[length:var(--text-label)] text-terracotta-ink hover:underline"
          >
            Preview draft
          </Link>
        </div>

        {revisions === null || revisions.length === 0 ? (
          <p className="text-body-sm mt-3 text-muted">
            No snapshots yet. A revision is recorded every time the campaign is published, so drafts
            leave no published history.
          </p>
        ) : (
          <ol className="mt-3 flex flex-col divide-y divide-sand">
            {revisions.map((revision) => (
              <li
                key={revision.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5"
              >
                <div>
                  <p className="text-[length:var(--text-label)] font-medium text-cocoa">
                    Version {revision.version}
                  </p>
                  <p className="text-[length:var(--text-caption)] text-muted">
                    {revision.publishedAt === null
                      ? revision.createdAt.slice(0, 16).replace('T', ' ')
                      : `published ${revision.publishedAt.slice(0, 16).replace('T', ' ')}`}
                  </p>
                </div>
                <Badge tone={revision.status === 'PUBLISHED' ? 'success' : 'neutral'} size="sm">
                  {revision.status}
                </Badge>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
