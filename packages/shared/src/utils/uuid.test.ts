import { describe, expect, it } from 'vitest';

import { isUuidV7, uuidv7, uuidV7TimestampMs } from './uuid.js';

describe('uuidv7', () => {
  it('produces syntactically valid v7 identifiers', () => {
    const id = uuidv7();
    expect(isUuidV7(id)).toBe(true);
    expect(id).toHaveLength(36);
    expect(id[14]).toBe('7');
    expect(['8', '9', 'a', 'b']).toContain(id[19]);
  });

  it('is unique across many calls', () => {
    const ids = new Set(Array.from({ length: 2000 }, () => uuidv7()));
    expect(ids.size).toBe(2000);
  });

  it('orders lexicographically by timestamp', () => {
    const first = uuidv7({ timestampMs: 1_700_000_000_000 });
    const second = uuidv7({ timestampMs: 1_700_000_001_000 });
    expect(first < second).toBe(true);
    for (let i = 0; i < 20; i += 1) {
      expect(uuidv7({ timestampMs: 1_700_000_000_000 }) < second).toBe(true);
    }
  });

  it('round-trips the embedded timestamp', () => {
    const timestampMs = 1_800_000_000_123;
    expect(uuidV7TimestampMs(uuidv7({ timestampMs }))).toBe(timestampMs);
  });

  it('rejects non-v7 values', () => {
    expect(isUuidV7('')).toBe(false);
    expect(isUuidV7('00000000-0000-4000-8000-000000000000')).toBe(false);
    expect(uuidV7TimestampMs('not-a-uuid')).toBeNull();
  });

  it('rejects an invalid timestamp override', () => {
    expect(() => uuidv7({ timestampMs: -1 })).toThrow(/non-negative/);
    expect(() => uuidv7({ timestampMs: Number.NaN })).toThrow(/non-negative/);
  });
});
