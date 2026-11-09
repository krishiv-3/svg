'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button, Input, Select, Textarea } from '@/components/ui';

import type { ContentDescriptor } from '@/lib/content-admin';

/**
 * Shared editor for activities, events and articles.
 *
 * Same contract as the campaign form: same-origin proxy, CSRF header from the
 * readable CSRF cookie, optimistic-free (it reloads after saving).
 */

type Values = Record<string, string | boolean>;

function csrf(): string {
  const match = document.cookie.match(/(?:^|;\s*)gaushala_csrf=([^;]+)/);
  return match?.[1] === undefined ? '' : decodeURIComponent(match[1]);
}

export function ContentForm({
  descriptor,
  initial,
  mode,
  id,
  version,
  categories,
}: {
  descriptor: ContentDescriptor;
  initial: Values;
  mode: 'create' | 'edit';
  id?: string;
  version: number;
  categories?: readonly { id: string; name: string }[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /** Optional URL fields must be empty or a real http(s) URL. */
  const urlErrors = (): Record<string, string> => {
    const found: Record<string, string> = {};

    for (const field of descriptor.fields) {
      if (field.key !== 'registrationUrl') continue;

      const raw = values[field.key];
      const text = typeof raw === 'string' ? raw.trim() : '';

      if (text === '') continue;

      try {
        const parsed = new URL(text);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
          found[field.key] = 'Use an http:// or https:// address.';
        }
      } catch {
        found[field.key] = 'Enter a complete URL, for example https://example.org/register.';
      }
    }

    return found;
  };

  const set = (key: string, value: string | boolean): void => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const payload = (): Record<string, unknown> => {
    const body: Record<string, unknown> = { version };

    for (const field of descriptor.fields) {
      const raw = values[field.key];

      if (field.type === 'checkbox') {
        body[field.key] = raw === true;
        continue;
      }

      const text = typeof raw === 'string' ? raw.trim() : '';

      if (field.type === 'number') {
        body[field.key] = text === '' ? null : Number(text);
      } else {
        body[field.key] = text === '' ? null : text;
      }
    }

    return body;
  };

  const send = async (path: string, method: 'POST' | 'PUT', body: unknown): Promise<boolean> => {
    const response = await fetch(`/api/admin${path}`, {
      method,
      headers: { 'content-type': 'application/json', 'x-csrf-token': csrf() },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const problem = (await response.json().catch(() => ({}))) as {
        title?: string;
        errors?: { path: string; message: string }[];
      };

      if (response.status === 422 && Array.isArray(problem.errors)) {
        const mapped: Record<string, string> = {};
        for (const issue of problem.errors) {
          mapped[issue.path] ??= issue.message;
        }
        setFieldErrors(mapped);
        setError('Some fields need attention.');
        return false;
      }

      setError(
        response.status === 409
          ? 'This item changed since you opened it. Reload before saving.'
          : (problem.title ?? `Request failed (${String(response.status)})`),
      );
      return false;
    }

    return true;
  };

  const submit = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    setMessage(null);
    setFieldErrors({});

    const local = urlErrors();

    if (Object.keys(local).length > 0) {
      setFieldErrors(local);
      setError('Some fields need attention.');
      setBusy(false);
      return;
    }

    try {
      const ok =
        mode === 'create'
          ? await send(`/${descriptor.kind}`, 'POST', payload())
          : await send(`/${descriptor.kind}/${id ?? ''}`, 'PUT', payload());

      if (ok) {
        router.push(`/admin/content/${descriptor.kind}`);
        router.refresh();
      }
    } catch {
      setError('The admin service is unavailable.');
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (action: 'publish' | 'unpublish' | 'archive'): Promise<void> => {
    setBusy(true);
    setError(null);

    try {
      const ok = await send(`/${descriptor.kind}/${id ?? ''}/status`, 'POST', { action });

      if (ok) {
        setMessage(`Saved: ${action} applied.`);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      {descriptor.fields.map((field) => {
        const raw = values[field.key];

        if (field.type === 'checkbox') {
          return (
            <label
              key={field.key}
              className="flex items-center gap-2 text-[length:var(--text-label)] text-cocoa"
            >
              <input
                type="checkbox"
                checked={raw === true}
                onChange={(event) => {
                  set(field.key, event.target.checked);
                }}
              />
              {field.label}
            </label>
          );
        }

        if (field.type === 'textarea') {
          return (
            <Textarea
              key={field.key}
              name={field.key}
              label={field.label}
              {...(field.hint === undefined ? {} : { hint: field.hint })}
              rows={field.rows ?? 4}
              required={field.required === true}
              value={typeof raw === 'string' ? raw : ''}
              onChange={(event) => {
                set(field.key, event.target.value);
              }}
            />
          );
        }

        if (field.type === 'select') {
          const options = [
            { value: '', label: 'No category' },
            ...(categories ?? []).map((category) => ({ value: category.id, label: category.name })),
          ];

          return (
            <Select
              key={field.key}
              name={field.key}
              label={field.label}
              options={options}
              value={typeof raw === 'string' ? raw : ''}
              onChange={(event) => {
                set(field.key, event.target.value);
              }}
            />
          );
        }

        return (
          <Input
            key={field.key}
            name={field.key}
            type={
              field.type === 'datetime'
                ? 'datetime-local'
                : field.type === 'number'
                  ? 'number'
                  : 'text'
            }
            label={field.label}
            {...(field.hint === undefined ? {} : { hint: field.hint })}
            required={field.required === true}
            {...(fieldErrors[field.key] === undefined ? {} : { error: fieldErrors[field.key] })}
            value={typeof raw === 'string' ? raw : ''}
            onChange={(event) => {
              set(field.key, event.target.value);
            }}
          />
        );
      })}

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

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="md" isLoading={busy}>
          {mode === 'create' ? 'Save draft' : 'Save changes'}
        </Button>
        {mode === 'edit' ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => void changeStatus('publish')}
            >
              Publish
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => void changeStatus('unpublish')}
            >
              Unpublish
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => void changeStatus('archive')}
            >
              Archive
            </Button>
          </>
        ) : null}
      </div>
    </form>
  );
}
