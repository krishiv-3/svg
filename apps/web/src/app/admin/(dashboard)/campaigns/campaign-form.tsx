'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button, Input, Select, Textarea } from '@/components/ui';
import { mapCampaignFieldErrors, validateManualEvidence } from '@/lib/campaign-errors';

/** Human labels for the validation summary. */
const FIELD_LABELS: Record<string, string> = {
  name: 'Campaign name',
  slug: 'Slug',
  purposeSummary: 'Short purpose',
  story: 'Story',
  targetRupees: 'Target',
  manualRaisedRupees: 'Raised so far',
  manualRaisedNote: 'Source note',
  progressSource: 'Progress source',
  startDate: 'Start date',
  endDate: 'End date',
  seoTitle: 'SEO title',
  seoDescription: 'SEO description',
};

/**
 * Campaign editor.
 *
 * Create and edit share one form. Every mutation posts through the same-origin
 * proxy with the CSRF token from the (readable) CSRF cookie; the session cookie
 * stays HttpOnly and is never touched by JavaScript.
 */

export interface CampaignFormValues {
  id?: string;
  version?: number;
  name: string;
  slug: string;
  purposeSummary: string;
  story: string;
  targetRupees: string;
  manualRaisedRupees: string;
  manualRaisedNote: string;
  progressSource: 'MANUAL' | 'VERIFIED_DONATIONS';
  startDate: string;
  endDate: string;
  isFeatured: boolean;
  acceptsDonations: boolean;
  seoTitle: string;
  seoDescription: string;
}

const EMPTY: CampaignFormValues = {
  name: '',
  slug: '',
  purposeSummary: '',
  story: '',
  targetRupees: '',
  manualRaisedRupees: '',
  manualRaisedNote: '',
  progressSource: 'MANUAL',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  isFeatured: false,
  acceptsDonations: true,
  seoTitle: '',
  seoDescription: '',
};

function csrf(): string {
  const match = document.cookie.match(/(?:^|;\s*)gaushala_csrf=([^;]+)/);
  return match?.[1] === undefined ? '' : decodeURIComponent(match[1]);
}

const rupeesToMinor = (value: string): number | null => {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
};

export function CampaignForm({
  initial = EMPTY,
  mode = 'create',
}: {
  initial?: CampaignFormValues;
  mode?: 'create' | 'edit';
}) {
  const router = useRouter();
  const [values, setValues] = useState<CampaignFormValues>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof CampaignFormValues>(
    key: K,
    value: CampaignFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const payload = () => ({
    name: values.name,
    slug: values.slug,
    purposeSummary: values.purposeSummary,
    story: values.story,
    targetAmountMinor: rupeesToMinor(values.targetRupees),
    manualRaisedMinor: rupeesToMinor(values.manualRaisedRupees),
    manualRaisedNote: values.manualRaisedNote === '' ? null : values.manualRaisedNote,
    progressSource: values.progressSource,
    startDate: values.startDate,
    endDate: values.endDate === '' ? null : values.endDate,
    isFeatured: values.isFeatured,
    acceptsDonations: values.acceptsDonations,
    seoTitle: values.seoTitle === '' ? null : values.seoTitle,
    seoDescription: values.seoDescription === '' ? null : values.seoDescription,
    version: values.version ?? 1,
  });

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
        const { fieldErrors: mapped } = mapCampaignFieldErrors(problem.errors);
        setFieldErrors(mapped);
        setError('Some fields need attention — see the messages below.');
        return false;
      }

      setFieldErrors({});
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

    // Same rule the server enforces; catching it here keeps the message next to
    // the field without a round trip. The server stays authoritative.
    const local = validateManualEvidence(
      values.progressSource,
      values.manualRaisedRupees,
      values.manualRaisedNote,
    );

    if (Object.keys(local).length > 0) {
      setFieldErrors(local);
      setError('Some fields need attention — see the messages below.');
      setBusy(false);
      return;
    }

    try {
      const ok =
        mode === 'create'
          ? await send('/campaigns', 'POST', payload())
          : await send(`/campaigns/${values.id ?? ''}`, 'PUT', payload());

      if (ok) {
        router.push('/admin/campaigns');
        router.refresh();
      }
    } catch {
      setError('The admin service is unavailable.');
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (
    action: 'publish' | 'unpublish' | 'archive' | 'schedule',
  ): Promise<void> => {
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const ok = await send(`/campaigns/${values.id ?? ''}/status`, 'POST', {
        action,
        ...(action === 'schedule' ? { scheduledFor: new Date(scheduledFor).toISOString() } : {}),
      });

      if (ok) {
        const labels: Record<typeof action, string> = {
          publish: 'published',
          unpublish: 'moved back to draft',
          archive: 'archived',
          schedule: 'scheduled',
        };
        setMessage(`Campaign ${labels[action]}.`);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const field = 'flex flex-col gap-1.5';

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="name"
          label="Campaign name"
          required
          value={values.name}
          onChange={(event) => {
            update('name', event.target.value);
          }}
        />
        <Input
          name="slug"
          label="Slug"
          hint="Lowercase, hyphen-separated. Appears in the public URL."
          required
          value={values.slug}
          onChange={(event) => {
            update('slug', event.target.value);
          }}
        />
      </div>

      <Textarea
        name="purposeSummary"
        label="Short purpose"
        hint="One sentence, shown on the campaign card."
        rows={2}
        required
        value={values.purposeSummary}
        onChange={(event) => {
          update('purposeSummary', event.target.value);
        }}
      />

      <Textarea
        name="story"
        label="Story"
        hint="Separate paragraphs with a blank line."
        rows={6}
        required
        value={values.story}
        onChange={(event) => {
          update('story', event.target.value);
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="targetRupees"
          label="Target (₹)"
          hint="Leave empty for a campaign without a financial goal."
          inputMode="numeric"
          value={values.targetRupees}
          onChange={(event) => {
            update('targetRupees', event.target.value);
          }}
        />
        <div className={field}>
          <Select
            name="progressSource"
            label="Progress source"
            value={values.progressSource}
            onChange={(event) => {
              update('progressSource', event.target.value as CampaignFormValues['progressSource']);
            }}
            options={[
              { value: 'MANUAL', label: 'Manual total (audited)' },
              { value: 'VERIFIED_DONATIONS', label: 'Verified donations (Phase 9)' },
            ]}
          />
        </div>
      </div>

      {values.progressSource === 'MANUAL' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="manualRaisedRupees"
            label="Raised so far (₹)"
            inputMode="numeric"
            {...(fieldErrors['manualRaisedRupees'] === undefined
              ? {}
              : { error: fieldErrors['manualRaisedRupees'] })}
            value={values.manualRaisedRupees}
            onChange={(event) => {
              update('manualRaisedRupees', event.target.value);
            }}
          />
          <Input
            name="manualRaisedNote"
            label="Source note"
            hint="Required with a manual total: where the figure comes from."
            {...(fieldErrors['manualRaisedNote'] === undefined
              ? {}
              : { error: fieldErrors['manualRaisedNote'] })}
            value={values.manualRaisedNote}
            onChange={(event) => {
              update('manualRaisedNote', event.target.value);
            }}
          />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="startDate"
          type="date"
          label="Start date"
          required
          value={values.startDate}
          onChange={(event) => {
            update('startDate', event.target.value);
          }}
        />
        <Input
          name="endDate"
          type="date"
          label="End date"
          value={values.endDate}
          onChange={(event) => {
            update('endDate', event.target.value);
          }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="seoTitle"
          label="SEO title"
          hint="Up to 70 characters."
          value={values.seoTitle}
          onChange={(event) => {
            update('seoTitle', event.target.value);
          }}
        />
        <Input
          name="seoDescription"
          label="SEO description"
          hint="Up to 180 characters."
          value={values.seoDescription}
          onChange={(event) => {
            update('seoDescription', event.target.value);
          }}
        />
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-[length:var(--text-label)] text-cocoa">
          <input
            type="checkbox"
            checked={values.isFeatured}
            onChange={(event) => {
              update('isFeatured', event.target.checked);
            }}
          />
          Feature on the homepage
        </label>
        <label className="flex items-center gap-2 text-[length:var(--text-label)] text-cocoa">
          <input
            type="checkbox"
            checked={values.acceptsDonations}
            onChange={(event) => {
              update('acceptsDonations', event.target.checked);
            }}
          />
          Accepts donations
        </label>
      </div>

      {error === null ? null : (
        <div role="alert" className="flex flex-col gap-1">
          <p className="text-[length:var(--text-body-sm)] text-danger">{error}</p>
          {Object.entries(fieldErrors).length === 0 ? null : (
            <ul className="list-disc pl-5 text-[length:var(--text-caption)] text-danger">
              {Object.entries(fieldErrors).map(([key, message]) => (
                <li key={key}>
                  <span className="font-semibold">{FIELD_LABELS[key] ?? key}:</span> {message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {message === null ? null : (
        <p role="status" className="text-[length:var(--text-body-sm)] text-success">
          {message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
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

            <div className="flex items-end gap-2">
              <Input
                name="scheduledFor"
                type="datetime-local"
                label="Schedule for"
                value={scheduledFor}
                onChange={(event) => {
                  setScheduledFor(event.target.value);
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={scheduledFor === ''}
                onClick={() => void changeStatus('schedule')}
              >
                Schedule
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </form>
  );
}
