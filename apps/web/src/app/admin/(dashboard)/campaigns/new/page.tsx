import Link from 'next/link';

import { CampaignForm } from '../campaign-form';

export const dynamic = 'force-dynamic';

export default function NewCampaignPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Link
          href="/admin/campaigns"
          className="text-[length:var(--text-label)] text-terracotta-ink hover:underline"
        >
          ← Campaigns
        </Link>
        <h1 className="text-title text-cocoa">New campaign</h1>
        <p className="text-body-sm text-charcoal/80">
          Saved as a draft. It becomes public only when you publish it.
        </p>
      </header>

      <div className="rounded-2xl border border-sand bg-white p-5 shadow-soft sm:p-6">
        <CampaignForm mode="create" />
      </div>
    </div>
  );
}
