import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui';
import { TestimonialForm, type TestimonialValues } from '@/components/admin/batch2-forms';
import { adminGet } from '@/lib/admin';

export const dynamic = 'force-dynamic';

interface Row {
  id: string;
  displayName: string;
  location: string | null;
  body: string;
  consentEvidence: string;
  consentDate: string;
  displayOrder: number;
  mediaId: string | null;
  approvalStatus: string;
  isVisible: boolean;
}

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await adminGet<Row>(`/testimonials/${id}`);

  if (row === null) notFound();

  const initial: TestimonialValues = {
    id: row.id,
    displayName: row.displayName,
    location: row.location ?? '',
    body: row.body,
    consentEvidence: row.consentEvidence,
    consentDate: row.consentDate.slice(0, 10),
    displayOrder: String(row.displayOrder),
    mediaId: row.mediaId ?? '',
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/admin/testimonials"
          className="text-[length:var(--text-label)] text-terracotta-ink hover:underline"
        >
          ← Testimonials
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-title text-cocoa">{row.displayName}</h1>
          <Badge tone={row.approvalStatus === 'APPROVED' ? 'success' : 'neutral'} size="sm">
            {row.approvalStatus}
          </Badge>
          <Badge tone={row.isVisible ? 'accent' : 'neutral'} size="sm">
            {row.isVisible ? 'VISIBLE' : 'HIDDEN'}
          </Badge>
        </div>
        <Link
          href={`/admin/testimonials/${row.id}/preview`}
          className="text-[length:var(--text-label)] text-terracotta-ink hover:underline"
        >
          Preview
        </Link>
      </header>

      <div className="rounded-2xl border border-sand bg-white p-5 shadow-soft sm:p-6">
        <TestimonialForm mode="edit" initial={initial} />
      </div>
    </div>
  );
}
