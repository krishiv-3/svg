/**
 * UUIDv7 generation (time-ordered, RFC 9562).
 *
 * The database design (ADR §2.1) uses UUIDv7 primary keys because they keep
 * B-tree inserts sequential instead of scattering them across pages.
 * Prisma cannot generate v7 natively, so identifiers are created in application
 * code by this single helper.
 *
 * Uses the Web Crypto API (`globalThis.crypto`) so the module stays usable in
 * both Node.js and edge runtimes.
 */

const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface UuidV7Options {
  /** Override for tests; defaults to `Date.now()`. */
  timestampMs?: number;
}

/**
 * Generate a UUIDv7 string.
 *
 * Layout: 48-bit big-endian Unix milliseconds, 4-bit version (7), 12 bits of
 * randomness, 2-bit variant (0b10), 62 bits of randomness.
 */
export function uuidv7(options: UuidV7Options = {}): string {
  const timestampMs = options.timestampMs ?? Date.now();
  if (!Number.isFinite(timestampMs) || timestampMs < 0) {
    throw new Error('uuidv7: timestampMs must be a non-negative finite number');
  }

  const buffer = new ArrayBuffer(16);
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  globalThis.crypto.getRandomValues(bytes);

  const ms = BigInt(Math.floor(timestampMs));
  view.setUint16(0, Number((ms >> 32n) & 0xffffn));
  view.setUint32(2, Number(ms & 0xffffffffn));

  view.setUint8(6, (view.getUint8(6) & 0x0f) | 0x70);
  view.setUint8(8, (view.getUint8(8) & 0x3f) | 0x80);

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/** True when `value` is a syntactically valid UUIDv7. */
export function isUuidV7(value: string): boolean {
  return UUID_V7_PATTERN.test(value);
}

/** Extract the embedded Unix millisecond timestamp from a UUIDv7. */
export function uuidV7TimestampMs(value: string): number | null {
  if (!isUuidV7(value)) {
    return null;
  }
  const hex = value.replace(/-/g, '').slice(0, 12);
  return Number.parseInt(hex, 16);
}
