import { Badge } from '@/components/ui';
import { ApiAction } from '@/components/admin/api-action';
import { adminGet } from '@/lib/admin';

export const dynamic = 'force-dynamic';

interface Row {
  id: string;
  label: string;
  value: number;
  unit: string | null;
  verificationStatus: string;
  isVisible: boolean;
  displayOrder: number;
}

export default async function ImpactPage() {
  const rows = await adminGet<Row[]>('/impact');

  if (rows === null) {
    return (
      <p className="text-body-sm text-muted">You do not have permission to view statistics.</p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-title text-cocoa">Impact statistics</h1>
        <p className="text-body-sm text-charcoal/80">
          Only verified figures can be published. Editing a figure withdraws its verification.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand bg-white/60 p-8 text-center">
          <p className="text-subheading text-cocoa">No statistics recorded</p>
          <p className="text-body-sm mt-1 text-muted">
            No figures exist yet; nothing is invented here.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-2xl border border-sand bg-white p-4 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[length:var(--text-label)] font-medium text-cocoa">
                    {row.value.toLocaleString('en-IN')}
                    {row.unit === null ? '' : ` ${row.unit}`} — {row.label}
                  </p>
                  <p className="text-[length:var(--text-caption)] text-muted">
                    Order {row.displayOrder}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    tone={row.verificationStatus === 'VERIFIED' ? 'success' : 'neutral'}
                    size="sm"
                  >
                    {row.verificationStatus}
                  </Badge>
                  <ApiAction
                    label={
                      row.verificationStatus === 'VERIFIED' ? 'Withdraw verification' : 'Verify'
                    }
                    path={`/impact/${row.id}/verification`}
                    body={{ verified: row.verificationStatus !== 'VERIFIED' }}
                  />
                  <ApiAction
                    label={row.isVisible ? 'Unpublish' : 'Publish'}
                    path={`/impact/${row.id}/visibility`}
                    body={{ visible: !row.isVisible }}
                    variant={row.isVisible ? 'outline' : 'primary'}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
