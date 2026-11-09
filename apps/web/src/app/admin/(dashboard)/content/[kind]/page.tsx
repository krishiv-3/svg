import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui';
import { adminGet } from '@/lib/admin';
import { isContentKind, descriptorFor } from '@/lib/content-admin';

export const dynamic = 'force-dynamic';

interface Row {
  id: string;
  title: string;
  slug: string;
  status: string;
  updatedAt: string;
  version: number;
}

export default async function ContentListPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;

  if (!isContentKind(kind)) notFound();

  const descriptor = descriptorFor(kind);
  const rows = await adminGet<Row[]>(`/${kind}`);

  if (rows === null) {
    return (
      <p className="text-body-sm text-muted">You do not have permission to view this module.</p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-title text-cocoa">{descriptor.plural}</h1>
          <p className="text-body-sm text-charcoal/80">
            Drafts stay private; publishing makes an item visible on the public site.
          </p>
        </div>
        <Link
          href={`/admin/content/${kind}/new`}
          className="rounded-lg bg-terracotta px-4 py-2 text-[length:var(--text-label)] font-medium text-white hover:bg-terracotta-ink"
        >
          New {descriptor.singular.toLowerCase()}
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand bg-white/60 p-8 text-center">
          <p className="text-subheading text-cocoa">Nothing here yet</p>
          <p className="text-body-sm mt-1 text-muted">
            Create the first {descriptor.singular.toLowerCase()}; it is saved as a draft.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sand bg-white shadow-soft">
          <table className="w-full text-left">
            <caption className="sr-only">{descriptor.plural}</caption>
            <thead>
              <tr className="border-b border-sand bg-ivory/60">
                <th scope="col" className="px-4 py-3 text-[length:var(--text-caption)] uppercase">
                  Title
                </th>
                <th scope="col" className="px-4 py-3 text-[length:var(--text-caption)] uppercase">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-[length:var(--text-caption)] uppercase">
                  Updated
                </th>
                <th scope="col" className="px-4 py-3 text-[length:var(--text-caption)] uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-sand/70 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/content/${kind}/${row.id}`}
                      className="text-[length:var(--text-label)] font-medium text-cocoa hover:underline"
                    >
                      {row.title}
                    </Link>
                    <p className="text-[length:var(--text-caption)] text-muted">/{row.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        row.status === 'PUBLISHED'
                          ? 'success'
                          : row.status === 'ARCHIVED'
                            ? 'neutral'
                            : 'accent'
                      }
                      size="sm"
                    >
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[length:var(--text-label)] text-muted">
                    {row.updatedAt.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/content/${kind}/${row.id}`}
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
