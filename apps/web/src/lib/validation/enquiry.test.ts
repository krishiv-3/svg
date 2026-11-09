import { describe, expect, it } from 'vitest';

import { ENQUIRY_LIMITS, validateEnquiry, type EnquiryValues } from './enquiry';

/**
 * Enquiry validation is a pure function, so the rules can be tested exactly and
 * reused on the server later without the form.
 */

const VALID: EnquiryValues = {
  name: 'Asha Verma',
  email: 'asha@example.com',
  subject: 'General enquiry',
  message: 'I would like to know when visits are possible, please.',
};

const fieldIds = (errors: readonly { fieldId: string }[]): string[] =>
  errors.map((error) => error.fieldId);

describe('validateEnquiry', () => {
  it('accepts a complete enquiry', () => {
    expect(validateEnquiry(VALID)).toEqual([]);
  });

  it('requires a name', () => {
    const errors = validateEnquiry({ ...VALID, name: '   ' });

    expect(fieldIds(errors)).toEqual(['enquiry-name']);
  });

  it('requires a plausible email address', () => {
    for (const email of ['', 'asha', 'asha@', 'asha@example', 'asha @example.com']) {
      const errors = validateEnquiry({ ...VALID, email });
      expect(fieldIds(errors)).toContain('enquiry-email');
    }
  });

  it('accepts a normal email address', () => {
    expect(validateEnquiry({ ...VALID, email: 'asha.verma@example.co.in' })).toEqual([]);
  });

  it('requires a subject', () => {
    expect(fieldIds(validateEnquiry({ ...VALID, subject: '' }))).toEqual(['enquiry-subject']);
  });

  it('requires a message of at least the minimum length', () => {
    const short = 'too short';

    expect(short.length).toBeLessThan(ENQUIRY_LIMITS.messageMin);
    expect(fieldIds(validateEnquiry({ ...VALID, message: short }))).toEqual(['enquiry-message']);
  });

  it('rejects an over-long message', () => {
    const errors = validateEnquiry({ ...VALID, message: 'a'.repeat(ENQUIRY_LIMITS.message + 1) });

    expect(fieldIds(errors)).toEqual(['enquiry-message']);
  });

  it('reports every problem at once', () => {
    const errors = validateEnquiry({ name: '', email: '', subject: '', message: '' });

    expect(fieldIds(errors)).toEqual([
      'enquiry-name',
      'enquiry-email',
      'enquiry-subject',
      'enquiry-message',
    ]);
  });

  it('gives every error a linkable field and a readable label', () => {
    for (const error of validateEnquiry({ name: '', email: '', subject: '', message: '' })) {
      expect(error.fieldId).toMatch(/^enquiry-/);
      expect(error.label.length).toBeGreaterThan(0);
      expect(error.message.length).toBeGreaterThan(0);
    }
  });
});
