import Link from 'next/link';

import { Badge } from '@/components/ui';
import { ApiAction } from '@/components/admin/api-action';
import { adminGet } from '@/lib/admin';

export const dynamic = 'force-dynamic';

interface Row {
  id: string;
  displayName: string;
  location: string | null;
  approvalStatus: string;
  isVisible: boolean;
  isArchived: boolean;
  displayOrder: number;
}

export default async function TestimonialsPage() {
  const rows = await adminGet<Row[]>('/testimonials?archived=true');

  if (rows === null) {
    return (
      <p className="text-body-sm text-muted">You do not have permission to view testimonials.</p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-title text-cocoa">Testimonials</h1>
        <p className="text-body-sm text-charcoal/80">
          A testimonial cannot be published until consent is recorded and it is approved.
        </p>
      </header>

      <div>
        <Link
          href="/admin/testimonials/new"
          className="rounded-lg bg-terracotta px-4 py-2 text-[length:var(--text-label)] font-medium text-white hover:bg-terracotta-ink"
        >
          New testimonial
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand bg-white/60 p-8 text-center">
          <p className="text-subheading text-cocoa">No testimonials</p>
          <p className="text-body-sm mt-1 text-muted">
            Nothing is shown here until a real testimonial with recorded consent is added.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-2xl border border-sand bg-white p-4 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link
                    href={`/admin/testimonials/${row.id}`}
                    className="text-[length:var(--text-label)] font-medium text-cocoa hover:underline"
                  >
                    {row.displayName}
                    {row.location === null ? '' : ` · ${row.location}`}
                  </Link>
                  <p className="text-[length:var(--text-caption)] text-muted">
                    Order {row.displayOrder}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={row.approvalStatus === 'APPROVED' ? 'success' : 'neutral'} size="sm">
                    {row.approvalStatus}
                  </Badge>
                  <Badge tone={row.isVisible ? 'accent' : 'neutral'} size="sm">
                    {row.isVisible ? 'VISIBLE' : 'HIDDEN'}
                  </Badge>
                  {row.isArchived ? (
                    <ApiAction
                      label="Restore"
                      path={`/testimonials/${row.id}/archive`}
                      body={{ archived: false }}
                    />
                  ) : (
                    <>
                      {row.approvalStatus !== 'APPROVED' ? (
                        <ApiAction
                          label="Approve"
                          path={`/testimonials/${row.id}/approval`}
                          body={{ action: 'approve' }}
                        />
                      ) : null}
                      <ApiAction
                        label={row.isVisible ? 'Unpublish' : 'Publish'}
                        path={`/testimonials/${row.id}/visibility`}
                        body={{ visible: !row.isVisible }}
                        variant={row.isVisible ? 'outline' : 'primary'}
                      />
                      <ApiAction
                        label="Archive"
                        path={`/testimonials/${row.id}/archive`}
                        body={{ archived: true }}
                        variant="ghost"
                        confirmText="Archive this testimonial? It will stop appearing on the site."
                      />
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
