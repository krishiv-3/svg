import Link from 'next/link';

import { Badge } from '@/components/ui';
import { adminGet } from '@/lib/admin';

export const dynamic = 'force-dynamic';

interface Row {
  id: string;
  reference: string;
  type: string;
  name: string;
  email: string;
  subject: string | null;
  status: string;
  createdAt: string;
  assignedTo: { id: string; name: string } | null;
}

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = '', status = '' } = await searchParams;
  const query = new URLSearchParams();
  if (q !== '') query.set('q', q);
  if (status !== '') query.set('status', status);

  const rows = await adminGet<Row[]>(`/enquiries?${query.toString()}`);

  if (rows === null) {
    return <p className="text-body-sm text-muted">You do not have permission to view enquiries.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-title text-cocoa">Enquiries</h1>
        <p className="text-body-sm text-charcoal/80">
          Private correspondence. Network metadata is never shown here.
        </p>
      </header>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <label className="flex flex-col gap-1.5">
          <span className="text-[length:var(--text-label)] font-medium text-cocoa">Search</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Name, email or reference"
            className="rounded-lg border border-border-strong bg-white px-3 py-2 text-[length:var(--text-label)]"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[length:var(--text-label)] font-medium text-cocoa">Status</span>
          <select
            name="status"
            defaultValue={status}
            className="rounded-lg border border-border-strong bg-white px-3 py-2 text-[length:var(--text-label)]"
          >
            <option value="">All</option>
            {['NEW', 'IN_PROGRESS', 'RESOLVED', 'SPAM', 'ARCHIVED'].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-terracotta px-4 py-2 text-[length:var(--text-label)] font-medium text-white"
        >
          Filter
        </button>
      </form>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand bg-white/60 p-8 text-center">
          <p className="text-subheading text-cocoa">No enquiries</p>
          <p className="text-body-sm mt-1 text-muted">
            Nothing matches. The public contact form does not submit yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sand bg-white shadow-soft">
          <table className="w-full text-left">
            <caption className="sr-only">Enquiries</caption>
            <thead>
              <tr className="border-b border-sand bg-ivory/60">
                <th scope="col" className="px-4 py-3 text-[length:var(--text-caption)] uppercase">
                  Reference
                </th>
                <th scope="col" className="px-4 py-3 text-[length:var(--text-caption)] uppercase">
                  From
                </th>
                <th scope="col" className="px-4 py-3 text-[length:var(--text-caption)] uppercase">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-[length:var(--text-caption)] uppercase">
                  Received
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-sand/70 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/enquiries/${row.id}`}
                      className="text-[length:var(--text-label)] font-medium text-terracotta-ink hover:underline"
                    >
                      {row.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[length:var(--text-label)] text-cocoa">{row.name}</p>
                    <p className="text-[length:var(--text-caption)] text-muted">{row.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={row.status === 'RESOLVED' ? 'success' : 'neutral'} size="sm">
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[length:var(--text-label)] text-muted">
                    {row.createdAt.slice(0, 10)}
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
