import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui';
import { adminGet } from '@/lib/admin';

export const dynamic = 'force-dynamic';

interface Row {
  id: string;
  displayName: string;
  location: string | null;
  body: string;
  approvalStatus: string;
  isVisible: boolean;
  preview: boolean;
}

export default async function TestimonialPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await adminGet<Row>(`/testimonials/${id}/preview`);

  if (row === null) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-terracotta/40 bg-terracotta/10 px-4 py-3">
        <p className="text-[length:var(--text-label)] font-medium text-terracotta-ink">
          Preview — not the live site. Status: {row.approvalStatus}
          {row.isVisible ? ' · visible' : ' · hidden'}
        </p>
        <Link
          href={`/admin/testimonials/${row.id}`}
          className="text-[length:var(--text-label)] text-terracotta-ink underline"
        >
          Back to editor
        </Link>
      </div>

      <article className="max-w-2xl rounded-2xl border border-sand bg-white p-6 shadow-soft">
        <Badge tone="neutral" size="sm">
          Testimonial
        </Badge>
        <blockquote className="mt-4 text-body text-charcoal/85">“{row.body}”</blockquote>
        <p className="mt-4 text-[length:var(--text-label)] font-medium text-cocoa">
          {row.displayName}
          {row.location === null ? '' : ` · ${row.location}`}
        </p>
      </article>
    </div>
  );
}
