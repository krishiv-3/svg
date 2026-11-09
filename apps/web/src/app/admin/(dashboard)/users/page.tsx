import { Badge } from '@/components/ui';
import { RoleEditor } from '@/components/admin/batch2-forms';
import { InviteForm } from '@/components/admin/invite-form';
import { ApiAction } from '@/components/admin/api-action';
import { adminGet } from '@/lib/admin';

export const dynamic = 'force-dynamic';

interface AdminRow {
  id: string;
  email: string;
  name: string;
  status: string;
  isSuperAdmin: boolean;
  lastLoginAt: string | null;
  roles: { key: string; name: string }[];
}

export default async function UsersPage() {
  const payload = await adminGet<{ users: AdminRow[]; roles: { key: string; name: string }[] }>(
    '/users',
  );

  if (payload === null) {
    return (
      <p className="text-body-sm text-muted">
        Administrator management is restricted to Super Administrators.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-title text-cocoa">Users</h1>
        <p className="text-body-sm text-charcoal/80">
          Invitations create an account without a password. Deactivating an account revokes its
          sessions immediately.
        </p>
      </header>

      <InviteForm roles={payload.roles} />

      <div className="overflow-x-auto rounded-2xl border border-sand bg-white shadow-soft">
        <table className="w-full text-left">
          <caption className="sr-only">Administrators</caption>
          <thead>
            <tr className="border-b border-sand bg-ivory/60">
              <th scope="col" className="px-4 py-3 text-[length:var(--text-caption)] uppercase">
                Account
              </th>
              <th scope="col" className="px-4 py-3 text-[length:var(--text-caption)] uppercase">
                Roles
              </th>
              <th scope="col" className="px-4 py-3 text-[length:var(--text-caption)] uppercase">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-[length:var(--text-caption)] uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {payload.users.map((user) => (
              <tr key={user.id} className="border-b border-sand/70 last:border-0">
                <td className="px-4 py-3">
                  <p className="text-[length:var(--text-label)] font-medium text-cocoa">
                    {user.name}
                  </p>
                  <p className="text-[length:var(--text-caption)] text-muted">{user.email}</p>
                </td>
                <td className="px-4 py-3 text-[length:var(--text-label)]">
                  {user.roles.map((role) => role.name).join(', ') || '—'}
                  {user.isSuperAdmin ? ' (super)' : ''}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={user.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                    {user.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <ApiAction
                      label={user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      path={`/users/${user.id}/status`}
                      body={{ status: user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' }}
                      variant={user.status === 'ACTIVE' ? 'outline' : 'secondary'}
                      confirmText={
                        user.status === 'ACTIVE'
                          ? 'Deactivate this administrator and revoke their sessions?'
                          : undefined
                      }
                    />
                    <ApiAction
                      label="Revoke sessions"
                      path={`/users/${user.id}/revoke-sessions`}
                      variant="ghost"
                      confirmText="Sign this administrator out of every device?"
                    />
                    <RoleEditor
                      userId={user.id}
                      roles={payload.roles}
                      current={user.roles.map((role) => role.key)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
