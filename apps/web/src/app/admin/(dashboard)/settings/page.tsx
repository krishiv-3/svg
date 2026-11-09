import { SettingsForm } from '@/components/admin/api-action';
import { adminGet } from '@/lib/admin';

export const dynamic = 'force-dynamic';

interface Row {
  key: string;
  category: string;
  description: string | null;
  value: Record<string, unknown>;
  updatedAt: string;
}

export default async function SettingsPage() {
  const rows = await adminGet<Row[]>('/settings');

  if (rows === null) {
    return <p className="text-body-sm text-muted">You do not have permission to view settings.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-title text-cocoa">Settings</h1>
        <p className="text-body-sm text-charcoal/80">
          These values feed the public site. Empty fields are valid and fall back to safe defaults.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand bg-white/60 p-8 text-center">
          <p className="text-subheading text-cocoa">No settings groups</p>
          <p className="text-body-sm mt-1 text-muted">Run the seed to create the default groups.</p>
        </div>
      ) : (
        rows.map((row) => (
          <section
            key={row.key}
            className="rounded-2xl border border-sand bg-white p-5 shadow-soft"
          >
            <div className="mb-3">
              <h2 className="text-subheading text-cocoa">{row.key}</h2>
              <p className="text-[length:var(--text-caption)] text-muted">
                {row.description ?? row.category} · updated {row.updatedAt.slice(0, 10)}
              </p>
            </div>
            <SettingsForm settingKey={row.key} value={row.value} />
          </section>
        ))
      )}
    </div>
  );
}
