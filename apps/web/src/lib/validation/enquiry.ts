/**
 * Enquiry validation.
 *
 * A pure function so the same rules can run in the browser today and on the
 * server later, and so they can be tested without rendering anything.
 *
 * It is deliberately strict about length rather than clever about content: a
 * form that rejects a valid message is worse than one that accepts an odd one.
 */

export interface EnquiryValues {
  readonly name: string;
  readonly email: string;
  readonly subject: string;
  readonly message: string;
}

export interface EnquiryFieldError {
  readonly fieldId: string;
  readonly label: string;
  readonly message: string;
}

export const ENQUIRY_LIMITS = {
  name: 80,
  email: 200,
  subject: 120,
  message: 2000,
  messageMin: 20,
} as const;

/** Pragmatic email shape: one @, no spaces, a dot in the domain. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEnquiry(values: EnquiryValues): readonly EnquiryFieldError[] {
  const errors: EnquiryFieldError[] = [];
  const name = values.name.trim();
  const email = values.email.trim();
  const subject = values.subject.trim();
  const message = values.message.trim();

  if (name.length === 0) {
    errors.push({ fieldId: 'enquiry-name', label: 'Name', message: 'Enter your name.' });
  } else if (name.length > ENQUIRY_LIMITS.name) {
    errors.push({
      fieldId: 'enquiry-name',
      label: 'Name',
      message: `Keep your name under ${String(ENQUIRY_LIMITS.name)} characters.`,
    });
  }

  if (email.length === 0) {
    errors.push({ fieldId: 'enquiry-email', label: 'Email', message: 'Enter your email address.' });
  } else if (!EMAIL_PATTERN.test(email) || email.length > ENQUIRY_LIMITS.email) {
    errors.push({
      fieldId: 'enquiry-email',
      label: 'Email',
      message: 'Enter an email address like name@example.com.',
    });
  }

  if (subject.length === 0) {
    errors.push({ fieldId: 'enquiry-subject', label: 'Subject', message: 'Choose a subject.' });
  }

  if (message.length < ENQUIRY_LIMITS.messageMin) {
    errors.push({
      fieldId: 'enquiry-message',
      label: 'Message',
      message: `Tell us a little more — at least ${String(ENQUIRY_LIMITS.messageMin)} characters.`,
    });
  } else if (message.length > ENQUIRY_LIMITS.message) {
    errors.push({
      fieldId: 'enquiry-message',
      label: 'Message',
      message: `Keep your message under ${String(ENQUIRY_LIMITS.message)} characters.`,
    });
  }

  return errors;
}
