'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button, Input, Textarea } from '@/components/ui';

/** CSRF token from the readable cookie; the session stays HttpOnly. */
function csrf(): string {
  const match = document.cookie.match(/(?:^|;\s*)gaushala_csrf=([^;]+)/);
  return match?.[1] === undefined ? '' : decodeURIComponent(match[1]);
}

/**
 * One button that performs one API action.
 *
 * Every admin list in this batch uses it, so the CSRF, error and refresh
 * behaviour exists once rather than in five near-identical components.
 */
export function ApiAction({
  label,
  path,
  method = 'POST',
  body,
  variant = 'secondary',
  confirmText,
}: {
  label: string;
  path: string;
  method?: 'POST' | 'PUT';
  body?: Record<string, unknown>;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  confirmText?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (): Promise<void> => {
    if (confirmText !== undefined && !window.confirm(confirmText)) return;

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin${path}`, {
        method,
        headers: { 'content-type': 'application/json', 'x-csrf-token': csrf() },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });

      if (!response.ok) {
        const problem = (await response.json().catch(() => ({}))) as {
          title?: string;
          detail?: string;
        };
        setError(problem.detail ?? problem.title ?? `Failed (${String(response.status)})`);
        return;
      }

      router.refresh();
    } catch {
      setError('The admin service is unavailable.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex flex-col gap-1">
      <Button
        type="button"
        size="sm"
        variant={variant}
        isLoading={busy}
        onClick={() => {
          void run();
        }}
      >
        {label}
      </Button>
      {error === null ? null : (
        <span role="alert" className="text-[length:var(--text-caption)] text-danger">
          {error}
        </span>
      )}
    </span>
  );
}

/** Edits a settings group as flat text fields, preserving unknown keys. */
export function SettingsForm({
  settingKey,
  value,
}: {
  settingKey: string;
  value: Record<string, unknown>;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        typeof entry === 'string' ? entry : JSON.stringify(entry),
      ]),
    ),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    setSaved(false);

    const payload: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(draft)) {
      try {
        payload[key] =
          entry.trim().startsWith('{') || entry.trim().startsWith('[') ? JSON.parse(entry) : entry;
      } catch {
        setError(`${key} looks like JSON but could not be parsed.`);
        setBusy(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/admin/settings/${settingKey}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-csrf-token': csrf() },
        body: JSON.stringify({ value: payload }),
      });

      if (!response.ok) {
        const problem = (await response.json().catch(() => ({}))) as {
          detail?: string;
          title?: string;
        };
        setError(problem.detail ?? problem.title ?? `Failed (${String(response.status)})`);
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError('The admin service is unavailable.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      {Object.entries(draft).map(([key, entry]) => {
        const long = entry.length > 80;

        return long ? (
          <Textarea
            key={key}
            name={key}
            label={key}
            rows={3}
            value={entry}
            onChange={(event) => {
              setDraft((current) => ({ ...current, [key]: event.target.value }));
            }}
          />
        ) : (
          <Input
            key={key}
            name={key}
            label={key}
            value={entry}
            onChange={(event) => {
              setDraft((current) => ({ ...current, [key]: event.target.value }));
            }}
          />
        );
      })}

      {error === null ? null : (
        <p role="alert" className="text-[length:var(--text-body-sm)] text-danger">
          {error}
        </p>
      )}
      {saved ? (
        <p role="status" className="text-[length:var(--text-body-sm)] text-success">
          Saved.
        </p>
      ) : null}

      <div>
        <Button type="submit" size="md" isLoading={busy}>
          Save settings
        </Button>
      </div>
    </form>
  );
}
