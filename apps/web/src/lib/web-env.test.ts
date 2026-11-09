import { describe, expect, it } from 'vitest';

import { DEV_SITE_URL, WebEnvValidationError, parseWebEnv } from './web-env';

/**
 * Web environment rules.
 *
 * The important guarantee: a production build can never proceed with a missing,
 * insecure or localhost site URL, because that value becomes every canonical
 * link and Open Graph URL on the site.
 */

const PRODUCTION = { isProduction: true } as const;
const DEVELOPMENT = { isProduction: false } as const;

describe('parseWebEnv — development', () => {
  it('falls back to localhost when the site URL is absent', () => {
    const env = parseWebEnv({}, DEVELOPMENT);

    expect(env.NEXT_PUBLIC_SITE_URL).toBe(DEV_SITE_URL);
    expect(env.API_URL).toBe('http://localhost:4000');
    expect(env.WEB_VERSION).toBe('0.0.0-dev');
  });

  it('accepts an explicit http://localhost URL', () => {
    const env = parseWebEnv({ NEXT_PUBLIC_SITE_URL: 'http://localhost:3100' }, DEVELOPMENT);

    expect(env.NEXT_PUBLIC_SITE_URL).toBe('http://localhost:3100');
  });

  it('accepts a real https URL without complaint', () => {
    const env = parseWebEnv({ NEXT_PUBLIC_SITE_URL: 'https://example.org' }, DEVELOPMENT);

    expect(env.NEXT_PUBLIC_SITE_URL).toBe('https://example.org');
  });
});

describe('parseWebEnv — production', () => {
  it('rejects a missing site URL', () => {
    expect(() => parseWebEnv({}, PRODUCTION)).toThrow(WebEnvValidationError);
    expect(() => parseWebEnv({}, PRODUCTION)).toThrow(
      /NEXT_PUBLIC_SITE_URL: required in production/,
    );
  });

  it('rejects a localhost site URL', () => {
    expect(() =>
      parseWebEnv({ NEXT_PUBLIC_SITE_URL: 'https://localhost:3000' }, PRODUCTION),
    ).toThrow(/must not point at a local host/);
  });

  it('rejects a loopback IP regardless of scheme', () => {
    expect(() => parseWebEnv({ NEXT_PUBLIC_SITE_URL: 'https://127.0.0.1' }, PRODUCTION)).toThrow(
      /must not point at a local host/,
    );
  });

  it('rejects plain http in production', () => {
    expect(() =>
      parseWebEnv({ NEXT_PUBLIC_SITE_URL: 'http://gaushala.example' }, PRODUCTION),
    ).toThrow(/must use https/);
  });

  it('rejects a value that is not a URL at all', () => {
    expect(() => parseWebEnv({ NEXT_PUBLIC_SITE_URL: 'not-a-url' }, PRODUCTION)).toThrow(
      WebEnvValidationError,
    );
  });

  it('accepts a valid https origin', () => {
    const env = parseWebEnv({ NEXT_PUBLIC_SITE_URL: 'https://gaushala.example' }, PRODUCTION);

    expect(env.NEXT_PUBLIC_SITE_URL).toBe('https://gaushala.example');
  });
});

describe('parseWebEnv — error reporting', () => {
  it('never echoes the offending value in the message', () => {
    const secretish = 'https://localhost:3000/?token=super-secret-value';

    try {
      parseWebEnv({ NEXT_PUBLIC_SITE_URL: secretish }, PRODUCTION);
      expect.unreachable('expected the parser to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(WebEnvValidationError);
      expect(String((error as Error).message)).not.toContain('super-secret-value');
    }
  });
});
