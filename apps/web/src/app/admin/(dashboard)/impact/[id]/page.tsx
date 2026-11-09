import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui';
import { ImpactForm, type ImpactValues } from '@/components/admin/batch2-forms';
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
  displayOrder: number;
  verificationStatus: string;
  isVisible: boolean;
}

export default async function EditImpactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await adminGet<Row[]>('/impact');
  const row = rows?.find((entry) => entry.id === id);

  if (row === undefined) notFound();

  const initial: ImpactValues = {
    id: row.id,
    label: row.label,
    value: String(row.value),
    unit: row.unit ?? '',
    methodology: row.methodology,
    sourceNote: row.sourceNote ?? '',
    periodLabel: row.periodLabel ?? '',
    displayOrder: String(row.displayOrder),
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/admin/impact"
          className="text-[length:var(--text-label)] text-terracotta-ink hover:underline"
        >
          ← Impact statistics
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-title text-cocoa">{row.label}</h1>
          <Badge tone={row.verificationStatus === 'VERIFIED' ? 'success' : 'neutral'} size="sm">
            {row.verificationStatus}
          </Badge>
          <Badge tone={row.isVisible ? 'accent' : 'neutral'} size="sm">
            {row.isVisible ? 'VISIBLE' : 'HIDDEN'}
          </Badge>
        </div>
        <Link
          href={`/admin/impact/${row.id}/preview`}
          className="text-[length:var(--text-label)] text-terracotta-ink hover:underline"
        >
          Preview
        </Link>
      </header>

      <div className="rounded-2xl border border-sand bg-white p-5 shadow-soft sm:p-6">
        <ImpactForm mode="edit" initial={initial} />
      </div>
    </div>
  );
}
