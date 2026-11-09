'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button, Input } from '@/components/ui';

function csrf(): string {
  const match = document.cookie.match(/(?:^|;\s*)gaushala_csrf=([^;]+)/);
  return match?.[1] === undefined ? '' : decodeURIComponent(match[1]);
}

/** Invite an administrator; the account is created INVITED with no password. */
export function InviteForm({ roles }: { roles: readonly { key: string; name: string }[] }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [roleKey, setRoleKey] = useState(roles[0]?.key ?? 'content_editor');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-csrf-token': csrf() },
        body: JSON.stringify({ email, name, roleKeys: [roleKey] }),
      });

      if (!response.ok) {
        const problem = (await response.json().catch(() => ({}))) as {
          detail?: string;
          title?: string;
        };
        setError(problem.detail ?? problem.title ?? `Failed (${String(response.status)})`);
        return;
      }

      setMessage(`Invitation created for ${email}. They cannot sign in until a password is set.`);
      setEmail('');
      setName('');
      router.refresh();
    } catch {
      setError('The admin service is unavailable.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-3 rounded-2xl border border-sand bg-white p-5 shadow-soft"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <h2 className="text-subheading text-cocoa">Invite an administrator</h2>

      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          name="email"
          type="email"
          label="Email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
        />
        <Input
          name="name"
          label="Name"
          required
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-[length:var(--text-label)] font-medium text-cocoa">Role</span>
          <select
            name="roleKey"
            className="rounded-lg border border-border-strong bg-white px-3 py-2 text-[length:var(--text-label)]"
            value={roleKey}
            onChange={(event) => {
              setRoleKey(event.target.value);
            }}
          >
            {roles.map((role) => (
              <option key={role.key} value={role.key}>
                {role.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error === null ? null : (
        <p role="alert" className="text-[length:var(--text-body-sm)] text-danger">
          {error}
        </p>
      )}
      {message === null ? null : (
        <p role="status" className="text-[length:var(--text-body-sm)] text-success">
          {message}
        </p>
      )}

      <div>
        <Button type="submit" size="md" isLoading={busy}>
          Send invitation
        </Button>
      </div>
    </form>
  );
}
