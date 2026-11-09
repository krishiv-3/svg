import { describe, expect, it } from 'vitest';

import { mapCampaignFieldErrors, validateManualEvidence } from './campaign-errors';

/**
 * Field-specific validation for the campaign editor.
 *
 * The API is authoritative; these tests pin the mapping that puts its errors
 * next to the right input, and the local guard that mirrors the manual-evidence
 * rule.
 */
describe('mapCampaignFieldErrors', () => {
  it('maps money payload fields onto the money inputs', () => {
    const { fieldErrors } = mapCampaignFieldErrors([
      { path: 'manualRaisedMinor', message: 'Enter the amount raised.' },
      { path: 'targetAmountMinor', message: 'Must be positive.' },
    ]);

    expect(fieldErrors['manualRaisedRupees']).toBe('Enter the amount raised.');
    expect(fieldErrors['targetRupees']).toBe('Must be positive.');
  });

  it('keeps fields whose payload and input names match', () => {
    const { fieldErrors } = mapCampaignFieldErrors([
      { path: 'manualRaisedNote', message: 'Describe where the total comes from.' },
    ]);

    expect(fieldErrors['manualRaisedNote']).toBe('Describe where the total comes from.');
  });

  it('keeps only the first message per field', () => {
    const { fieldErrors, unmapped } = mapCampaignFieldErrors([
      { path: 'name', message: 'Too short.' },
      { path: 'name', message: 'Second message.' },
    ]);

    expect(fieldErrors['name']).toBe('Too short.');
    expect(unmapped).toHaveLength(1);
  });
});

describe('validateManualEvidence', () => {
  it('requires a note for a manual total', () => {
    expect(validateManualEvidence('MANUAL', '7500', '')['manualRaisedNote']).toBeDefined();
  });

  it('treats a whitespace-only note as missing', () => {
    expect(validateManualEvidence('MANUAL', '7500', '   ')['manualRaisedNote']).toBeDefined();
  });

  it('accepts a manual total with a real note', () => {
    expect(validateManualEvidence('MANUAL', '7500', 'Recorded in the ledger')).toEqual({});
  });

  it('does not demand a note for verified donations', () => {
    expect(validateManualEvidence('VERIFIED_DONATIONS', '', '')).toEqual({});
  });

  it('treats undefined as a missing note instead of throwing', () => {
    expect(validateManualEvidence('MANUAL', '7500', undefined)['manualRaisedNote']).toBeDefined();
  });

  it('treats null as a missing note', () => {
    expect(validateManualEvidence('MANUAL', '7500', null)['manualRaisedNote']).toBeDefined();
  });

  it('treats an empty string as a missing note', () => {
    expect(validateManualEvidence('MANUAL', '7500', '')['manualRaisedNote']).toBeDefined();
  });

  it('never throws for missing optional input', () => {
    expect(() => validateManualEvidence(undefined, undefined, undefined)).not.toThrow();
    expect(() => validateManualEvidence(null, null, null)).not.toThrow();
  });

  it('requires evidence only while the source is manual', () => {
    const manual = validateManualEvidence('MANUAL', '', '');
    expect(manual['manualRaisedNote']).toBeDefined();
    expect(manual['manualRaisedRupees']).toBeDefined();

    // Switching to verified donations drops both requirements.
    expect(validateManualEvidence('VERIFIED_DONATIONS', '', '')).toEqual({});
    // Switching back restores them.
    expect(validateManualEvidence('MANUAL', '', '')['manualRaisedNote']).toBeDefined();
  });
});
