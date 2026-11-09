import { Badge } from '@/components/ui';
import { adminGet } from '@/lib/admin';

export const dynamic = 'force-dynamic';

interface AdminEnquiry {
  id: string;
  reference: string;
  type: string;
  name: string;
  email: string;
  subject: string | null;
  status: string;
  createdAt: string;
}

export default async function AdminEnquiriesPage() {
  const enquiries = await adminGet<AdminEnquiry[]>('/enquiries');

  if (enquiries === null) {
    return <p className="text-body-sm text-muted">You do not have permission to view enquiries.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-title text-cocoa">Enquiries</h1>
        <p className="text-body-sm text-charcoal/80">
          Inbound messages. The public contact form does not submit yet, so this list stays empty
          until that milestone connects it.
        </p>
      </header>

      {enquiries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand bg-white/60 p-8 text-center">
          <p className="text-subheading text-cocoa">No enquiries</p>
          <p className="text-body-sm mt-1 text-muted">
            Nothing has been submitted. No placeholder records are shown.
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
                  Subject
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
              {enquiries.map((enquiry) => (
                <tr key={enquiry.id} className="border-b border-sand/70 last:border-0">
                  <td className="px-4 py-3 text-[length:var(--text-label)] tabular-nums">
                    {enquiry.reference}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[length:var(--text-label)] text-cocoa">{enquiry.name}</p>
                    <p className="text-[length:var(--text-caption)] text-muted">{enquiry.email}</p>
                  </td>
                  <td className="px-4 py-3 text-[length:var(--text-label)]">
                    {enquiry.subject ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="neutral" size="sm">
                      {enquiry.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[length:var(--text-label)] text-muted">
                    {enquiry.createdAt.slice(0, 10)}
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
