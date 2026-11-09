/**
 * Mapping API validation errors onto campaign form fields.
 *
 * The API returns `errors: [{ path, message }]` where `path` is the **payload**
 * field name (`targetAmountMinor`), while the form edits display values
 * (`targetRupees`). Keeping the mapping in one pure function makes the
 * field-specific behaviour testable without a browser.
 */

export interface ApiFieldError {
  readonly path: string;
  readonly message: string;
}

/** Payload name → form input name, where they differ. */
const FIELD_ALIASES: Record<string, string> = {
  targetAmountMinor: 'targetRupees',
  manualRaisedMinor: 'manualRaisedRupees',
};

export function mapCampaignFieldErrors(errors: readonly ApiFieldError[]): {
  fieldErrors: Record<string, string>;
  unmapped: string[];
} {
  const fieldErrors: Record<string, string> = {};
  const unmapped: string[] = [];

  for (const error of errors) {
    const field = FIELD_ALIASES[error.path] ?? error.path;

    // First message per field wins: later duplicates are usually consequences.
    if (fieldErrors[field] === undefined) {
      fieldErrors[field] = error.message;
    } else {
      unmapped.push(`${field}: ${error.message}`);
    }
  }

  return { fieldErrors, unmapped };
}

/**
 * Client-side guard mirroring the server rule, so the common mistake is caught
 * before a round trip. The server remains authoritative.
 */
export function validateManualEvidence(
  progressSource: string,
  manualRaisedRupees: string,
  manualRaisedNote: string,
): Record<string, string> {
  if (progressSource !== 'MANUAL') return {};

  const errors: Record<string, string> = {};

  if (manualRaisedRupees.trim() === '') {
    errors['manualRaisedRupees'] = 'Enter the amount raised so far.';
  }

  if (manualRaisedNote.trim() === '') {
    errors['manualRaisedNote'] = 'Describe where the manual total comes from.';
  }

  return errors;
}
