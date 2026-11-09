import Link from 'next/link';

import { Badge } from '@/components/ui';
import { adminGet } from '@/lib/admin';

export const dynamic = 'force-dynamic';

interface DashboardCounts {
  readonly counts: {
    readonly campaigns: readonly { status: string; _count: { _all: number } }[];
    readonly news: readonly { status: string; _count: { _all: number } }[];
    readonly events: readonly { status: string; _count: { _all: number } }[];
    readonly enquiries: readonly { status: string; _count: { _all: number } }[];
    readonly testimonials: number;
    readonly impact: number;
  };
  readonly recentCampaigns: readonly {
    id: string;
    name: string;
    status: string;
    updatedAt: string;
  }[];
  readonly recentEnquiries: readonly {
    id: string;
    reference: string;
    name: string;
    subject: string | null;
    status: string;
  }[];
}

const total = (rows: readonly { _count: { _all: number } }[]): number =>
  rows.reduce((sum, row) => sum + row._count._all, 0);

export default async function AdminDashboardPage() {
  const dashboard = await adminGet<DashboardCounts>('/dashboard');

  if (dashboard === null) {
    return <p className="text-body-sm text-muted">Sign in to view the dashboard.</p>;
  }

  const cards = [
    { label: 'Campaigns', value: total(dashboard.counts.campaigns), href: '/admin/campaigns' },
    { label: 'News articles', value: total(dashboard.counts.news) },
    { label: 'Events', value: total(dashboard.counts.events) },
    { label: 'Enquiries', value: total(dashboard.counts.enquiries), href: '/admin/enquiries' },
    { label: 'Testimonials', value: dashboard.counts.testimonials },
    { label: 'Impact figures', value: dashboard.counts.impact },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-title text-cocoa">Dashboard</h1>
        <p className="text-body-sm text-charcoal/80">
          Content status at a glance. Counts come straight from the database.
        </p>
      </header>

      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="sr-only">
          Overview
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <li
              key={card.label}
              className="rounded-2xl border border-sand bg-white p-5 shadow-soft"
            >
              <p className="text-[length:var(--text-overline)] font-semibold tracking-[0.14em] text-muted uppercase">
                {card.label}
              </p>
              <p className="text-title mt-1 font-semibold text-cocoa tabular-nums">{card.value}</p>
              {card.href === undefined ? null : (
                <Link
                  href={card.href}
                  className="mt-2 inline-block text-[length:var(--text-label)] text-terracotta-ink underline-offset-4 hover:underline"
                >
                  Manage
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-sand bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-subheading text-cocoa">Recent campaigns</h2>
            <Link
              href="/admin/campaigns"
              className="text-[length:var(--text-label)] text-terracotta-ink"
            >
              View all
            </Link>
          </div>

          {dashboard.recentCampaigns.length === 0 ? (
            <p className="text-body-sm mt-3 text-muted">No campaigns yet.</p>
          ) : (
            <ul className="mt-3 flex flex-col divide-y divide-sand">
              {dashboard.recentCampaigns.map((campaign) => (
                <li key={campaign.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link
                    href={`/admin/campaigns/${campaign.id}`}
                    className="text-[length:var(--text-label)] font-medium text-cocoa hover:underline"
                  >
                    {campaign.name}
                  </Link>
                  <Badge tone={campaign.status === 'PUBLISHED' ? 'success' : 'neutral'} size="sm">
                    {campaign.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-sand bg-white p-5 shadow-soft">
          <h2 className="text-subheading text-cocoa">Recent enquiries</h2>

          {dashboard.recentEnquiries.length === 0 ? (
            <p className="text-body-sm mt-3 text-muted">
              No enquiries yet. The contact form is not connected to a submission endpoint, so this
              will stay empty until that milestone.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col divide-y divide-sand">
              {dashboard.recentEnquiries.map((enquiry) => (
                <li key={enquiry.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[length:var(--text-label)] font-medium text-cocoa">
                      {enquiry.name}
                    </p>
                    <p className="truncate text-[length:var(--text-caption)] text-muted">
                      {enquiry.subject ?? enquiry.reference}
                    </p>
                  </div>
                  <Badge tone="neutral" size="sm">
                    {enquiry.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-sand bg-white p-5 shadow-soft">
        <h2 className="text-subheading text-cocoa">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href="/admin/campaigns/new"
            className="rounded-lg bg-terracotta px-4 py-2 text-[length:var(--text-label)] font-medium text-white hover:bg-terracotta-ink"
          >
            New campaign
          </Link>
          <Link
            href="/admin/campaigns"
            className="rounded-lg border border-terracotta-ink px-4 py-2 text-[length:var(--text-label)] font-medium text-terracotta-ink hover:bg-terracotta/10"
          >
            Review drafts
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-border-strong px-4 py-2 text-[length:var(--text-label)] font-medium text-cocoa hover:bg-ivory"
          >
            View public site
          </Link>
        </div>
      </section>

      <p className="text-[length:var(--text-caption)] text-muted">
        Draft counts include scheduled and archived items, which never appear on the public site.
      </p>
    </div>
  );
}
