/**
 * Money utilities.
 *
 * ADR-007: monetary amounts are stored and transported as integer minor units
 * (paise) plus an ISO-4217 currency code. Nothing in the system stores or
 * transmits a floating-point rupee value, so totals, comparisons and provider
 * reconciliation are exact.
 */

export const DEFAULT_CURRENCY = 'INR' as const;

export type Currency = typeof DEFAULT_CURRENCY;

export interface Money {
  /** Integer minor units (paise). Always >= 0 for a valid amount. */
  amountMinor: number;
  currency: Currency;
}

/** Guard used before any amount reaches the database or a payment provider. */
export function isValidAmountMinor(amountMinor: number, maxMinor?: number): boolean {
  if (!Number.isSafeInteger(amountMinor)) {
    return false;
  }
  if (amountMinor <= 0) {
    return false;
  }
  return maxMinor === undefined || amountMinor <= maxMinor;
}

export function assertValidAmountMinor(amountMinor: number, maxMinor?: number): void {
  if (!isValidAmountMinor(amountMinor, maxMinor)) {
    throw new RangeError(
      `Invalid amount in minor units: ${String(amountMinor)}` +
        (maxMinor === undefined ? '' : ` (maximum ${maxMinor})`),
    );
  }
}

/** Convert a whole-rupee value into minor units, rejecting fractions of a paisa. */
export function rupeesToMinor(rupees: number): number {
  if (!Number.isFinite(rupees)) {
    throw new TypeError('rupeesToMinor: value must be finite');
  }
  const minor = Math.round(rupees * 100);
  if (Math.abs(rupees * 100 - minor) > 1e-6) {
    throw new RangeError('rupeesToMinor: value has sub-paisa precision');
  }
  return minor;
}

export function minorToRupees(amountMinor: number): number {
  return amountMinor / 100;
}

/**
 * Format a money value for display, e.g. `₹1,001` or `₹1,001.50`.
 *
 * Uses `en-IN` digit grouping; the API never formats money, so every client
 * renders consistently.
 */
export function formatMoney(money: Money, locale: string = 'en-IN'): string {
  const { amountMinor, currency } = money;
  const hasPaise = amountMinor % 100 !== 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(minorToRupees(amountMinor));
}

/** Convenience wrapper for the single currency the site accepts. */
export function formatInr(amountMinor: number, locale: string = 'en-IN'): string {
  return formatMoney({ amountMinor, currency: DEFAULT_CURRENCY }, locale);
}
