'use client';

import { useRef, useState } from 'react';

import { Alert, Button, FormErrorSummary, Input, Select, Textarea } from '@/components/ui';
import {
  ENQUIRY_LIMITS,
  validateEnquiry,
  type EnquiryFieldError,
  type EnquiryValues,
} from '@/lib/validation/enquiry';

/**
 * Contact enquiry form.
 *
 * This form is **not connected to a backend**. It validates exactly as it will
 * when the endpoint exists, reports field-level errors, and then says plainly
 * that nothing was sent — it never claims delivery.
 *
 * Accessibility: every field is labelled by the design-system components, errors
 * set `aria-invalid` and are referenced through `aria-describedby`, the summary
 * is a `role="alert"` and receives focus on failure, and the result is announced
 * in a live region.
 */

const SUBJECTS = [
  'General enquiry',
  'Visiting the gaushala',
  'Volunteering',
  'Fundraising',
] as const;

const EMPTY: EnquiryValues = { name: '', email: '', subject: '', message: '' };

export function ContactForm({ notice }: { notice: string }) {
  const [values, setValues] = useState<EnquiryValues>(EMPTY);
  const [errors, setErrors] = useState<readonly EnquiryFieldError[]>([]);
  const [validated, setValidated] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const errorFor = (fieldId: string): string | undefined =>
    errors.find((error) => error.fieldId === fieldId)?.message;

  const update =
    (key: keyof EnquiryValues) =>
    (event: { target: { value: string } }): void => {
      setValues((current) => ({ ...current, [key]: event.target.value }));
      setValidated(false);
    };

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();

        const nextErrors = validateEnquiry(values);
        setErrors(nextErrors);

        if (nextErrors.length > 0) {
          setValidated(false);
          // Move focus to the summary so the first problem is announced.
          requestAnimationFrame(() => {
            summaryRef.current?.focus();
          });
          return;
        }

        setValidated(true);
      }}
    >
      <Alert tone="info" title="This form is not connected yet">
        {notice}
      </Alert>

      <div ref={summaryRef} tabIndex={-1} className="outline-none">
        {errors.length === 0 ? null : (
          <FormErrorSummary errors={[...errors]} title="Please check the form" />
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          name="enquiry-name"
          label="Your name"
          autoComplete="name"
          required
          value={values.name}
          onChange={update('name')}
          {...(errorFor('enquiry-name') === undefined ? {} : { error: errorFor('enquiry-name') })}
        />

        <Input
          name="enquiry-email"
          type="email"
          label="Email address"
          autoComplete="email"
          required
          hint="Used only to reply to this enquiry."
          value={values.email}
          onChange={update('email')}
          {...(errorFor('enquiry-email') === undefined ? {} : { error: errorFor('enquiry-email') })}
        />
      </div>

      <Select
        name="enquiry-subject"
        label="Subject"
        required
        value={values.subject}
        onChange={update('subject')}
        options={[
          { value: '', label: 'Choose a subject' },
          ...SUBJECTS.map((subject) => ({ value: subject, label: subject })),
        ]}
        {...(errorFor('enquiry-subject') === undefined
          ? {}
          : { error: errorFor('enquiry-subject') })}
      />

      <Textarea
        name="enquiry-message"
        label="Message"
        required
        rows={6}
        hint={`At least ${String(ENQUIRY_LIMITS.messageMin)} characters.`}
        value={values.message}
        onChange={update('message')}
        {...(errorFor('enquiry-message') === undefined
          ? {}
          : { error: errorFor('enquiry-message') })}
      />

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="md">
          Check message
        </Button>
        <p className="text-[length:var(--text-caption)] text-muted">
          Validation runs locally. Nothing is transmitted.
        </p>
      </div>

      {/* Result region: announces the outcome without implying delivery. */}
      <div role="status" aria-live="polite">
        {validated ? (
          <Alert tone="warning" title="Validated — but not sent">
            Your message passed validation. There is no backend endpoint yet, so it was not sent and
            nothing was stored. This is a preview of the form, not a working contact channel.
          </Alert>
        ) : null}
      </div>
    </form>
  );
}
