import Link from 'next/link';

import { ImpactForm } from '@/components/admin/batch2-forms';

export const dynamic = 'force-dynamic';

export default function NewImpactPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Link
          href="/admin/impact"
          className="text-[length:var(--text-label)] text-terracotta-ink hover:underline"
        >
          ← Impact statistics
        </Link>
        <h1 className="text-title text-cocoa">New statistic</h1>
        <p className="text-body-sm text-charcoal/80">
          Record a figure only if it comes from a real record. Verification happens after the figure
          is entered.
        </p>
      </header>

      <div className="rounded-2xl border border-sand bg-white p-5 shadow-soft sm:p-6">
        <ImpactForm mode="create" />
      </div>
    </div>
  );
}
