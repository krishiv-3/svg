'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button, Input, Select, Textarea } from '@/components/ui';

/** CSRF token from the readable cookie; the session cookie stays HttpOnly. */
function csrf(): string {
  const match = document.cookie.match(/(?:^|;\s*)gaushala_csrf=([^;]+)/);
  return match?.[1] === undefined ? '' : decodeURIComponent(match[1]);
}

interface FieldError {
  path: string;
  message: string;
}

async function send(
  path: string,
  method: 'POST' | 'PUT',
  body: unknown,
): Promise<
  { ok: true } | { ok: false; status: number; message: string; fields: Record<string, string> }
> {
  const response = await fetch(`/api/admin${path}`, {
    method,
    headers: { 'content-type': 'application/json', 'x-csrf-token': csrf() },
    body: JSON.stringify(body),
  });

  if (response.ok) return { ok: true };

  const problem = (await response.json().catch(() => ({}))) as {
    title?: string;
    detail?: string;
    errors?: FieldError[];
  };

  const fields: Record<string, string> = {};
  for (const issue of problem.errors ?? []) fields[issue.path] ??= issue.message;

  return {
    ok: false,
    status: response.status,
    message: problem.detail ?? problem.title ?? `Request failed (${String(response.status)})`,
    fields,
  };
}

/* ------------------------------------------------------------- testimonial */

export interface TestimonialValues {
  id?: string;
  displayName: string;
  location: string;
  body: string;
  consentEvidence: string;
  consentDate: string;
  displayOrder: string;
  mediaId: string;
}

export const EMPTY_TESTIMONIAL: TestimonialValues = {
  displayName: '',
  location: '',
  body: '',
  consentEvidence: '',
  consentDate: '',
  displayOrder: '0',
  mediaId: '',
};

export function TestimonialForm({
  initial = EMPTY_TESTIMONIAL,
  mode,
}: {
  initial?: TestimonialValues;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const [values, setValues] = useState<TestimonialValues>(initial);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof TestimonialValues, value: string): void => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const submit = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    setFields({});

    const result = await send(
      mode === 'create' ? '/testimonials' : `/testimonials/${values.id ?? ''}`,
      mode === 'create' ? 'POST' : 'PUT',
      {
        displayName: values.displayName,
        location: values.location === '' ? null : values.location,
        body: values.body,
        consentEvidence: values.consentEvidence,
        consentDate: values.consentDate,
        displayOrder: Number(values.displayOrder === '' ? '0' : values.displayOrder),
        mediaId: values.mediaId === '' ? null : values.mediaId,
      },
    ).catch(() => null);

    setBusy(false);

    if (result === null) {
      setError('The admin service is unavailable.');
      return;
    }

    if (!result.ok) {
      setFields(result.fields);
      setError(result.message);
      return;
    }

    router.push('/admin/testimonials');
    router.refresh();
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="displayName"
          label="Name"
          required
          value={values.displayName}
          {...(fields['displayName'] === undefined ? {} : { error: fields['displayName'] })}
          onChange={(event) => {
            set('displayName', event.target.value);
          }}
        />
        <Input
          name="location"
          label="Location (optional)"
          value={values.location}
          {...(fields['location'] === undefined ? {} : { error: fields['location'] })}
          onChange={(event) => {
            set('location', event.target.value);
          }}
        />
      </div>

      <Textarea
        name="body"
        label="Testimonial"
        hint="The supporter's own words. Do not paraphrase or invent."
        rows={4}
        required
        value={values.body}
        {...(fields['body'] === undefined ? {} : { error: fields['body'] })}
        onChange={(event) => {
          set('body', event.target.value);
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="consentEvidence"
          label="Consent evidence"
          hint="Where the written consent is recorded."
          required
          value={values.consentEvidence}
          {...(fields['consentEvidence'] === undefined ? {} : { error: fields['consentEvidence'] })}
          onChange={(event) => {
            set('consentEvidence', event.target.value);
          }}
        />
        <Input
          name="consentDate"
          type="date"
          label="Consent date"
          required
          value={values.consentDate}
          {...(fields['consentDate'] === undefined ? {} : { error: fields['consentDate'] })}
          onChange={(event) => {
            set('consentDate', event.target.value);
          }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="displayOrder"
          type="number"
          label="Display order"
          value={values.displayOrder}
          {...(fields['displayOrder'] === undefined ? {} : { error: fields['displayOrder'] })}
          onChange={(event) => {
            set('displayOrder', event.target.value);
          }}
        />
        <Input
          name="mediaId"
          label="Media reference (optional)"
          hint="Existing media ID; left empty until uploads exist."
          value={values.mediaId}
          {...(fields['mediaId'] === undefined ? {} : { error: fields['mediaId'] })}
          onChange={(event) => {
            set('mediaId', event.target.value);
          }}
        />
      </div>

      {error === null ? null : (
        <p role="alert" className="text-[length:var(--text-body-sm)] text-danger">
          {error}
        </p>
      )}

      <p className="text-[length:var(--text-caption)] text-muted">
        New testimonials are saved as PENDING. Consent evidence is required before approval, and
        approval is required before publication.
      </p>

      <div>
        <Button type="submit" size="md" isLoading={busy}>
          {mode === 'create' ? 'Save testimonial' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ impact */

export interface ImpactValues {
  id?: string;
  label: string;
  value: string;
  unit: string;
  methodology: string;
  sourceNote: string;
  periodLabel: string;
  displayOrder: string;
}

export const EMPTY_IMPACT: ImpactValues = {
  label: '',
  value: '',
  unit: '',
  methodology: '',
  sourceNote: '',
  periodLabel: '',
  displayOrder: '0',
};

export function ImpactForm({
  initial = EMPTY_IMPACT,
  mode,
}: {
  initial?: ImpactValues;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const [values, setValues] = useState<ImpactValues>(initial);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof ImpactValues, value: string): void => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const submit = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    setFields({});

    const result = await send(
      mode === 'create' ? '/impact' : `/impact/${values.id ?? ''}`,
      mode === 'create' ? 'POST' : 'PUT',
      {
        label: values.label,
        value: Number(values.value),
        unit: values.unit === '' ? null : values.unit,
        methodology: values.methodology,
        sourceNote: values.sourceNote === '' ? null : values.sourceNote,
        periodLabel: values.periodLabel === '' ? null : values.periodLabel,
        displayOrder: Number(values.displayOrder === '' ? '0' : values.displayOrder),
      },
    ).catch(() => null);

    setBusy(false);

    if (result === null) {
      setError('The admin service is unavailable.');
      return;
    }

    if (!result.ok) {
      setFields(result.fields);
      setError(result.message);
      return;
    }

    router.push('/admin/impact');
    router.refresh();
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          name="label"
          label="Label"
          required
          value={values.label}
          {...(fields['label'] === undefined ? {} : { error: fields['label'] })}
          onChange={(event) => {
            set('label', event.target.value);
          }}
        />
        <Input
          name="value"
          type="number"
          label="Value"
          required
          value={values.value}
          {...(fields['value'] === undefined ? {} : { error: fields['value'] })}
          onChange={(event) => {
            set('value', event.target.value);
          }}
        />
        <Input
          name="unit"
          label="Unit (optional)"
          value={values.unit}
          {...(fields['unit'] === undefined ? {} : { error: fields['unit'] })}
          onChange={(event) => {
            set('unit', event.target.value);
          }}
        />
      </div>

      <Textarea
        name="methodology"
        label="Methodology"
        hint="How the figure is counted. Required before verification."
        rows={3}
        required
        value={values.methodology}
        {...(fields['methodology'] === undefined ? {} : { error: fields['methodology'] })}
        onChange={(event) => {
          set('methodology', event.target.value);
        }}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          name="sourceNote"
          label="Source note (optional)"
          value={values.sourceNote}
          {...(fields['sourceNote'] === undefined ? {} : { error: fields['sourceNote'] })}
          onChange={(event) => {
            set('sourceNote', event.target.value);
          }}
        />
        <Input
          name="periodLabel"
          label="Period (optional)"
          value={values.periodLabel}
          {...(fields['periodLabel'] === undefined ? {} : { error: fields['periodLabel'] })}
          onChange={(event) => {
            set('periodLabel', event.target.value);
          }}
        />
        <Input
          name="displayOrder"
          type="number"
          label="Display order"
          value={values.displayOrder}
          {...(fields['displayOrder'] === undefined ? {} : { error: fields['displayOrder'] })}
          onChange={(event) => {
            set('displayOrder', event.target.value);
          }}
        />
      </div>

      {error === null ? null : (
        <p role="alert" className="text-[length:var(--text-body-sm)] text-danger">
          {error}
        </p>
      )}

      {mode === 'edit' ? (
        <p className="text-[length:var(--text-caption)] text-muted">
          Saving an edit withdraws verification and unpublishes the figure until it is verified
          again.
        </p>
      ) : null}

      <div>
        <Button type="submit" size="md" isLoading={busy}>
          {mode === 'create' ? 'Save statistic' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------- roles */

export function RoleEditor({
  userId,
  roles,
  current,
}: {
  userId: string;
  roles: readonly { key: string; name: string }[];
  current: readonly string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([...current]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const toggle = (key: string): void => {
    setSelected((currentKeys) =>
      currentKeys.includes(key)
        ? currentKeys.filter((entry) => entry !== key)
        : [...currentKeys, key],
    );
  };

  const save = async (): Promise<void> => {
    if (selected.length === 0) {
      setError('An administrator needs at least one role.');
      return;
    }

    setBusy(true);
    setError(null);
    setSaved(false);

    const result = await send(`/users/${userId}/roles`, 'POST', { roleKeys: selected }).catch(
      () => null,
    );

    setBusy(false);

    if (result === null) {
      setError('The admin service is unavailable.');
      return;
    }

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setSaved(true);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-2">
      {roles.map((role) => (
        <label
          key={role.key}
          className="flex items-center gap-2 text-[length:var(--text-label)] text-cocoa"
        >
          <input
            type="checkbox"
            checked={selected.includes(role.key)}
            onChange={() => {
              toggle(role.key);
            }}
          />
          {role.name}
        </label>
      ))}

      {error === null ? null : (
        <p role="alert" className="text-[length:var(--text-caption)] text-danger">
          {error}
        </p>
      )}
      {saved ? (
        <p role="status" className="text-[length:var(--text-caption)] text-success">
          Roles saved.
        </p>
      ) : null}

      <Button
        type="button"
        size="sm"
        variant="secondary"
        isLoading={busy}
        onClick={() => {
          void save();
        }}
      >
        Save roles
      </Button>
    </div>
  );
}

/* --------------------------------------------------------------- assignment */

export function AssignForm({
  enquiryId,
  current,
  assignees,
}: {
  enquiryId: string;
  current: string | null;
  assignees: readonly { id: string; name: string }[];
}) {
  const router = useRouter();
  const [userId, setUserId] = useState(current ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    setSaved(false);

    const result = await send(`/enquiries/${enquiryId}/assign`, 'POST', {
      userId: userId === '' ? null : userId,
    }).catch(() => null);

    setBusy(false);

    if (result === null) {
      setError('The admin service is unavailable.');
      return;
    }

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setSaved(true);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-3">
      <Select
        name="assignee"
        label="Assigned to"
        value={userId}
        options={[
          { value: '', label: 'Unassigned' },
          ...assignees.map((person) => ({ value: person.id, label: person.name })),
        ]}
        onChange={(event) => {
          setUserId(event.target.value);
        }}
      />

      {error === null ? null : (
        <p role="alert" className="text-[length:var(--text-caption)] text-danger">
          {error}
        </p>
      )}
      {saved ? (
        <p role="status" className="text-[length:var(--text-caption)] text-success">
          Assignment saved.
        </p>
      ) : null}

      <div>
        <Button
          type="button"
          size="sm"
          isLoading={busy}
          onClick={() => {
            void save();
          }}
        >
          Save assignment
        </Button>
      </div>
    </div>
  );
}
