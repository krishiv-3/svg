import { describe, expect, it } from 'vitest';

import { EnvValidationError, parseEnv } from './env.js';

const VALID = {
  NODE_ENV: 'development',
  APP_ENV: 'development',
  DATABASE_URL: 'postgresql://gaushala_app:secret@localhost:5432/gaushala_dev',
  MIGRATE_DATABASE_URL: 'postgresql://gaushala_owner:secret@localhost:5432/gaushala_dev',
  CORS_ORIGINS: 'http://localhost:3000, https://staging.example.test',
  SITE_URL: 'http://localhost:3000',
} satisfies Record<string, string>;

function errorIssues(source: Record<string, string | undefined>): string[] {
  try {
    parseEnv(source);
  } catch (error) {
    if (error instanceof EnvValidationError) {
      return error.issues;
    }
    throw error;
  }
  throw new Error('expected parseEnv to throw');
}

describe('parseEnv', () => {
  it('applies documented defaults', () => {
    const env = parseEnv(VALID);
    expect(env.port).toBe(4000);
    expect(env.host).toBe('0.0.0.0');
    expect(env.logLevel).toBe('info');
    expect(env.logPretty).toBe(false);
    expect(env.trustProxy).toBe(false);
    expect(env.version).toBe('0.0.0-dev');
    expect(env.gitSha).toBeNull();
    expect(env.isProduction).toBe(false);
  });

  it('derives booleans, numbers and lists from strings', () => {
    const env = parseEnv({
      ...VALID,
      PORT: '8080',
      LOG_PRETTY: 'true',
      TRUST_PROXY: '1',
      GIT_SHA: 'abc1234',
      APP_VERSION: '1.2.3',
    });
    expect(env.port).toBe(8080);
    expect(env.logPretty).toBe(true);
    expect(env.trustProxy).toBe(true);
    expect(env.gitSha).toBe('abc1234');
    expect(env.version).toBe('1.2.3');
    expect(env.corsOrigins).toEqual(['http://localhost:3000', 'https://staging.example.test']);
  });

  it('requires a database URL', () => {
    const issues = errorIssues({ ...VALID, DATABASE_URL: undefined });
    expect(issues.join('\n')).toMatch(/DATABASE_URL/);
  });

  it('rejects a non-postgres URL', () => {
    const issues = errorIssues({ ...VALID, DATABASE_URL: 'mysql://user@host/db' });
    expect(issues.join('\n')).toMatch(/valid postgresql:\/\/ URL/);
  });

  it('rejects a URL without a database name', () => {
    const issues = errorIssues({ ...VALID, DATABASE_URL: 'postgresql://user@localhost:5432/' });
    expect(issues.join('\n')).toMatch(/URL/);
  });

  it('refuses a local database in production', () => {
    const issues = errorIssues({
      ...VALID,
      NODE_ENV: 'production',
      APP_ENV: 'production',
      SITE_URL: 'https://example.org',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/gaushala',
    });
    expect(issues.join('\n')).toMatch(/local host/);
  });

  it('requires NODE_ENV=production when APP_ENV=production', () => {
    const issues = errorIssues({
      ...VALID,
      APP_ENV: 'production',
      SITE_URL: 'https://example.org',
      DATABASE_URL: 'postgresql://user:pass@db.internal:5432/gaushala',
    });
    expect(issues.join('\n')).toMatch(/NODE_ENV/);
  });

  it('requires https for the production site URL', () => {
    const issues = errorIssues({
      ...VALID,
      NODE_ENV: 'production',
      APP_ENV: 'production',
      DATABASE_URL: 'postgresql://user:pass@db.internal:5432/gaushala',
    });
    expect(issues.join('\n')).toMatch(/https/);
  });

  it('accepts a valid production configuration', () => {
    const env = parseEnv({
      NODE_ENV: 'production',
      APP_ENV: 'production',
      DATABASE_URL: 'postgresql://user:pass@db.internal:5432/gaushala?sslmode=require',
      SITE_URL: 'https://example.org',
    });
    expect(env.isProduction).toBe(true);
  });

  it('forces test environments onto a *_test database', () => {
    const issues = errorIssues({
      ...VALID,
      NODE_ENV: 'test',
      APP_ENV: 'test',
      DATABASE_URL: 'postgresql://gaushala_app:secret@localhost:5432/gaushala_dev',
    });
    expect(issues.join('\n')).toMatch(/_test/);
  });

  it('accepts a test configuration pointing at a *_test database', () => {
    const env = parseEnv({
      ...VALID,
      NODE_ENV: 'test',
      APP_ENV: 'test',
      DATABASE_URL: 'postgresql://gaushala_app:secret@localhost:5432/gaushala_test',
    });
    expect(env.isTest).toBe(true);
  });

  it('refuses a production-looking database name outside production', () => {
    const issues = errorIssues({
      ...VALID,
      DATABASE_URL: 'postgresql://user:pass@db.internal:5432/gaushala_prod',
    });
    expect(issues.join('\n')).toMatch(/looks like production/);
  });

  it('reports a malformed URL through the base schema', () => {
    const issues = errorIssues({ ...VALID, SITE_URL: 'not-a-url' });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatch(/SITE_URL/);
  });

  it('reports every semantic problem at once, not just the first', () => {
    const issues = errorIssues({
      NODE_ENV: 'development',
      APP_ENV: 'production',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/gaushala',
      SITE_URL: 'http://example.org',
    });

    // local database host + NODE_ENV mismatch + insecure SITE_URL
    expect(issues.length).toBeGreaterThanOrEqual(3);
    expect(issues.join('\n')).toMatch(/local host/);
    expect(issues.join('\n')).toMatch(/NODE_ENV/);
    expect(issues.join('\n')).toMatch(/https/);
  });

  it('never echoes secret values in the error message', () => {
    try {
      parseEnv({ ...VALID, DATABASE_URL: 'postgres://user:SUPER_SECRET@host:5432/x_prod' });
    } catch (error) {
      expect(String(error)).not.toContain('SUPER_SECRET');
      return;
    }
    throw new Error('expected a validation error');
  });
});
