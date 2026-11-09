import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui';
import { adminGet } from '@/lib/admin';

export const dynamic = 'force-dynamic';

interface Row {
  id: string;
  label: string;
  value: number;
  unit: string | null;
  methodology: string;
  sourceNote: string | null;
  periodLabel: string | null;
  verificationStatus: string;
  isVisible: boolean;
  preview: boolean;
}

export default async function ImpactPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await adminGet<Row>(`/impact/${id}/preview`);

  if (row === null) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-terracotta/40 bg-terracotta/10 px-4 py-3">
        <p className="text-[length:var(--text-label)] font-medium text-terracotta-ink">
          Preview — not the live site. {row.verificationStatus}
          {row.isVisible ? ' · visible' : ' · hidden'}
        </p>
        <Link
          href={`/admin/impact/${row.id}`}
          className="text-[length:var(--text-label)] text-terracotta-ink underline"
        >
          Back to editor
        </Link>
      </div>

      <article className="max-w-2xl rounded-2xl border border-sand bg-white p-6 shadow-soft">
        <Badge tone="neutral" size="sm">
          Impact statistic
        </Badge>
        <p className="text-title mt-3 font-semibold text-cocoa tabular-nums">
          {row.value.toLocaleString('en-IN')}
          {row.unit === null ? '' : ` ${row.unit}`}
        </p>
        <p className="text-body text-charcoal/85">{row.label}</p>
        {row.periodLabel === null ? null : (
          <p className="mt-2 text-[length:var(--text-caption)] text-muted">{row.periodLabel}</p>
        )}
        <div className="mt-4 border-t border-sand pt-3">
          <p className="text-[length:var(--text-caption)] uppercase text-muted">Methodology</p>
          <p className="text-body-sm text-charcoal/85">{row.methodology}</p>
          {row.sourceNote === null ? null : (
            <p className="mt-2 text-[length:var(--text-caption)] text-muted">
              Source: {row.sourceNote}
            </p>
          )}
        </div>
      </article>
    </div>
  );
}
