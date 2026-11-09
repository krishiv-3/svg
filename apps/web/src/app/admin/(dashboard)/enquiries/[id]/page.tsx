import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui';
import { ApiAction } from '@/components/admin/api-action';
import { adminGet } from '@/lib/admin';

export const dynamic = 'force-dynamic';

const TRANSITIONS: Record<string, readonly string[]> = {
  NEW: ['IN_PROGRESS', 'RESOLVED', 'SPAM', 'ARCHIVED'],
  IN_PROGRESS: ['RESOLVED', 'SPAM', 'ARCHIVED'],
  RESOLVED: ['IN_PROGRESS', 'ARCHIVED'],
  SPAM: ['ARCHIVED'],
  ARCHIVED: [],
};

interface Detail {
  id: string;
  reference: string;
  type: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  createdAt: string;
  assignedTo: { id: string; name: string } | null;
  event: { id: string; title: string } | null;
}

export default async function EnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await adminGet<Detail>(`/enquiries/${id}`);

  if (row === null) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/admin/enquiries"
          className="text-[length:var(--text-label)] text-terracotta-ink hover:underline"
        >
          ← Enquiries
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-title text-cocoa">{row.reference}</h1>
          <Badge tone={row.status === 'RESOLVED' ? 'success' : 'neutral'} size="sm">
            {row.status}
          </Badge>
        </div>
        <p className="text-[length:var(--text-caption)] text-muted">
          {row.type} · received {row.createdAt.slice(0, 16).replace('T', ' ')}
          {row.assignedTo === null ? '' : ` · assigned to ${row.assignedTo.name}`}
        </p>
      </header>

      <section className="rounded-2xl border border-sand bg-white p-5 shadow-soft">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[length:var(--text-caption)] uppercase text-muted">From</dt>
            <dd className="text-[length:var(--text-label)] text-cocoa">{row.name}</dd>
          </div>
          <div>
            <dt className="text-[length:var(--text-caption)] uppercase text-muted">Contact</dt>
            <dd className="text-[length:var(--text-label)] text-cocoa">
              {row.email}
              {row.phone === null ? '' : ` · ${row.phone}`}
            </dd>
          </div>
          {row.subject === null ? null : (
            <div className="sm:col-span-2">
              <dt className="text-[length:var(--text-caption)] uppercase text-muted">Subject</dt>
              <dd className="text-[length:var(--text-label)] text-cocoa">{row.subject}</dd>
            </div>
          )}
        </dl>

        <p className="mt-4 whitespace-pre-line border-t border-sand pt-4 text-body text-charcoal/85">
          {row.message}
        </p>
      </section>

      <section className="rounded-2xl border border-sand bg-white p-5 shadow-soft">
        <h2 className="text-subheading text-cocoa">Update status</h2>
        {TRANSITIONS[row.status]?.length === 0 ? (
          <p className="text-body-sm mt-2 text-muted">
            This enquiry is archived; no further changes.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {(TRANSITIONS[row.status] ?? []).map((next) => (
              <ApiAction
                key={next}
                label={next.replace('_', ' ')}
                path={`/enquiries/${row.id}/status`}
                body={{ status: next }}
                variant={next === 'RESOLVED' ? 'primary' : 'secondary'}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
