import Link from 'next/link';

import { Badge } from '@/components/ui';
import { adminGet } from '@/lib/admin';

export const dynamic = 'force-dynamic';

interface AdminCampaign {
  id: string;
  name: string;
  slug: string;
  status: string;
  targetAmountMinor: number | null;
  manualRaisedMinor: number | null;
  isFeatured: boolean;
  updatedAt: string;
}

const inr = (minor: number | null): string =>
  minor === null
    ? '—'
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(minor / 100);

export default async function AdminCampaignsPage() {
  const campaigns = await adminGet<AdminCampaign[]>('/campaigns');

  if (campaigns === null) {
    return <p className="text-body-sm text-muted">You do not have permission to view campaigns.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-title text-cocoa">Campaigns</h1>
          <p className="text-body-sm text-charcoal/80">
            Drafts stay private. Publishing makes a campaign appear on the public site immediately.
          </p>
        </div>
        <Link
          href="/admin/campaigns/new"
          className="rounded-lg bg-terracotta px-4 py-2 text-[length:var(--text-label)] font-medium text-white hover:bg-terracotta-ink"
        >
          New campaign
        </Link>
      </header>

      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand bg-white/60 p-8 text-center">
          <p className="text-subheading text-cocoa">No campaigns yet</p>
          <p className="text-body-sm mt-1 text-muted">
            Create the first campaign; it is saved as a draft until you publish it.
          </p>
          <Link
            href="/admin/campaigns/new"
            className="mt-4 inline-block rounded-lg bg-terracotta px-4 py-2 text-[length:var(--text-label)] font-medium text-white"
          >
            New campaign
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sand bg-white shadow-soft">
          <table className="w-full text-left">
            <caption className="sr-only">All campaigns</caption>
            <thead>
              <tr className="border-b border-sand bg-ivory/60">
                <th scope="col" className="px-4 py-3 text-[length:var(--text-caption)] uppercase">
                  Name
                </th>
                <th scope="col" className="px-4 py-3 text-[length:var(--text-caption)] uppercase">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-[length:var(--text-caption)] uppercase">
                  Target
                </th>
                <th scope="col" className="px-4 py-3 text-[length:var(--text-caption)] uppercase">
                  Raised
                </th>
                <th scope="col" className="px-4 py-3 text-[length:var(--text-caption)] uppercase">
                  Featured
                </th>
                <th scope="col" className="px-4 py-3 text-[length:var(--text-caption)] uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-sand/70 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/campaigns/${campaign.id}`}
                      className="text-[length:var(--text-label)] font-medium text-cocoa hover:underline"
                    >
                      {campaign.name}
                    </Link>
                    <p className="text-[length:var(--text-caption)] text-muted">/{campaign.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        campaign.status === 'PUBLISHED'
                          ? 'success'
                          : campaign.status === 'ARCHIVED'
                            ? 'neutral'
                            : 'accent'
                      }
                      size="sm"
                    >
                      {campaign.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[length:var(--text-label)] tabular-nums">
                    {inr(campaign.targetAmountMinor)}
                  </td>
                  <td className="px-4 py-3 text-[length:var(--text-label)] tabular-nums">
                    {inr(campaign.manualRaisedMinor)}
                  </td>
                  <td className="px-4 py-3 text-[length:var(--text-label)]">
                    {campaign.isFeatured ? 'Yes' : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/campaigns/${campaign.id}`}
                      className="text-[length:var(--text-label)] text-terracotta-ink hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
