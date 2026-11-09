import { describe, expect, it } from 'vitest';

import {
  assertValidAmountMinor,
  formatInr,
  formatMoney,
  isValidAmountMinor,
  minorToRupees,
  rupeesToMinor,
} from './money.js';

describe('amount validation', () => {
  it('accepts positive integer minor units', () => {
    expect(isValidAmountMinor(10100)).toBe(true);
    expect(isValidAmountMinor(1)).toBe(true);
  });

  it('rejects zero, negative, fractional and unsafe values', () => {
    expect(isValidAmountMinor(0)).toBe(false);
    expect(isValidAmountMinor(-500)).toBe(false);
    expect(isValidAmountMinor(10.5)).toBe(false);
    expect(isValidAmountMinor(Number.NaN)).toBe(false);
    expect(isValidAmountMinor(Number.MAX_SAFE_INTEGER + 2)).toBe(false);
  });

  it('enforces an optional maximum', () => {
    expect(isValidAmountMinor(1_000_000, 500_000)).toBe(false);
    expect(isValidAmountMinor(500_000, 500_000)).toBe(true);
  });

  it('throws a range error when asserted', () => {
    expect(() => assertValidAmountMinor(0)).toThrow(RangeError);
    expect(() => assertValidAmountMinor(900, 100)).toThrow(/maximum 100/);
    expect(() => assertValidAmountMinor(900)).not.toThrow();
  });
});

describe('conversion', () => {
  it('converts rupees to minor units exactly', () => {
    expect(rupeesToMinor(101)).toBe(10100);
    expect(rupeesToMinor(0.01)).toBe(1);
    expect(rupeesToMinor(1001.5)).toBe(100150);
  });

  it('rejects sub-paisa precision and non-finite values', () => {
    expect(() => rupeesToMinor(1.005)).toThrow(/sub-paisa/);
    expect(() => rupeesToMinor(Number.POSITIVE_INFINITY)).toThrow(TypeError);
  });

  it('converts back to rupees', () => {
    expect(minorToRupees(10100)).toBe(101);
    expect(minorToRupees(1)).toBe(0.01);
  });
});

describe('formatting', () => {
  it('formats whole rupees without decimals using Indian grouping', () => {
    expect(formatInr(10100)).toBe('₹101');
    expect(formatInr(100100)).toBe('₹1,001');
    expect(formatInr(10000100)).toBe('₹1,00,001');
  });

  it('shows paise only when present', () => {
    expect(formatInr(10150)).toBe('₹101.50');
    expect(formatInr(1)).toBe('₹0.01');
  });

  it('formats through the Money shape', () => {
    expect(formatMoney({ amountMinor: 25100, currency: 'INR' })).toBe('₹251');
  });
});
