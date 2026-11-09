import request from 'supertest';
import { describe, expect, it } from 'vitest';

import {
  PROBLEM_CONTENT_TYPE,
  livenessResponseSchema,
  problemDetailsSchema,
  readinessResponseSchema,
  versionResponseSchema,
} from '@gaushala/shared';

import { createApp } from './app.js';
import { parseEnv } from './core/config/env.js';
import { createLogger } from './core/logging/logger.js';
import type { PrismaClient } from './generated/prisma/client.js';

const config = parseEnv({
  NODE_ENV: 'test',
  APP_ENV: 'development',
  DATABASE_URL: 'postgresql://gaushala_app:secret@localhost:5432/gaushala_dev',
  CORS_ORIGINS: 'http://localhost:3000',
  APP_VERSION: '0.0.0-test',
});

const logger = createLogger({ level: 'silent' });

/**
 * Stub that satisfies the readiness probes without a database. Unit tests must
 * stay fast and dependency-free; the real database is exercised in
 * tests/integration.
 */
function stubPrisma(behaviour: 'up' | 'down'): PrismaClient {
  return {
    $queryRaw: (strings: TemplateStringsArray) => {
      if (behaviour === 'down') {
        return Promise.reject(new Error('connect ECONNREFUSED 127.0.0.1:5432'));
      }
      const sql = Array.isArray(strings) ? strings.join(' ') : '';
      if (sql.includes('_prisma_migrations')) {
        return Promise.resolve([{ pending: BigInt(0), total: BigInt(2) }]);
      }
      return Promise.resolve([{ ok: 1 }]);
    },
  } as unknown as PrismaClient;
}

function appWith(behaviour: 'up' | 'down' = 'up') {
  return createApp({ config, logger, prisma: stubPrisma(behaviour) });
}

describe('liveness', () => {
  it('returns 200 without touching any dependency', async () => {
    const response = await request(appWith('down')).get('/health/live');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok', service: 'gaushala-api' });
    expect(() => livenessResponseSchema.parse(response.body)).not.toThrow();
    expect(response.headers['cache-control']).toBe('no-store');
  });
});

describe('readiness', () => {
  it('returns 200 when the database and migrations are healthy', async () => {
    const response = await request(appWith('up')).get('/health/ready');

    expect(response.status).toBe(200);
    const parsed = readinessResponseSchema.parse(response.body);
    expect(parsed.status).toBe('ok');
    expect(parsed.checks.database.status).toBe('up');
    expect(parsed.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
    expect(parsed.checks.migrations).toMatchObject({ status: 'up', pending: 0 });
  });

  it('returns 503 when the database is unreachable', async () => {
    const response = await request(appWith('down')).get('/health/ready');

    expect(response.status).toBe(503);
    const parsed = readinessResponseSchema.parse(response.body);
    expect(parsed.status).toBe('error');
    expect(parsed.checks.database.status).toBe('down');
    expect(parsed.checks.migrations.status).toBe('skipped');
    // The failure detail must never contain a connection string or credentials.
    expect(JSON.stringify(response.body)).not.toContain('secret');
    expect(JSON.stringify(response.body)).not.toContain('gaushala_app');
  });
});

describe('version', () => {
  it('reports build provenance', async () => {
    const response = await request(appWith()).get('/version');

    expect(response.status).toBe(200);
    const parsed = versionResponseSchema.parse(response.body);
    expect(parsed.version).toBe('0.0.0-test');
    expect(parsed.environment).toBe('development');
  });
});

describe('api index', () => {
  it('serves the v1 discovery document', async () => {
    const response = await request(appWith()).get('/api/v1');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ name: 'gaushala-api', version: '0.0.0-test' });
  });
});

describe('error handling', () => {
  it('returns an RFC 9457 problem document for unknown routes', async () => {
    const response = await request(appWith()).get('/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toContain(PROBLEM_CONTENT_TYPE);
    const problem = problemDetailsSchema.parse(response.body);
    expect(problem.code).toBe('NOT_FOUND');
    expect(problem.instance).toBe('/does-not-exist');
    expect(problem.requestId).toBeDefined();
  });

  it('maps malformed JSON bodies to a 400 problem document', async () => {
    const response = await request(appWith())
      .post('/api/v1')
      .set('Content-Type', 'application/json')
      .send('{"broken":');

    expect(response.status).toBe(400);
    const problem = problemDetailsSchema.parse(response.body);
    expect(problem.code).toBe('MALFORMED_REQUEST');
  });

  it('does not leak internal error details', async () => {
    const response = await request(appWith()).get('/does-not-exist');
    const raw = JSON.stringify(response.body);

    expect(raw).not.toContain('node_modules');
    expect(raw).not.toContain(' at ');
    expect(raw).not.toContain('.ts:');
  });
});

describe('request correlation', () => {
  it('generates a request id and echoes it', async () => {
    const response = await request(appWith()).get('/health/live');
    const id = response.headers['x-request-id'];

    expect(id).toBeDefined();
    expect(String(id)).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('honours a caller-supplied request id', async () => {
    const response = await request(appWith())
      .get('/health/live')
      .set('x-request-id', 'client-request-123');

    expect(response.headers['x-request-id']).toBe('client-request-123');
  });

  it('rejects an unsafe request id instead of reflecting it', async () => {
    const response = await request(appWith())
      .get('/health/live')
      .set('x-request-id', '<script>alert(1)</script>');

    expect(response.headers['x-request-id']).not.toContain('<script>');
  });
});

describe('security headers', () => {
  it('sets hardening headers and hides the framework', async () => {
    const response = await request(appWith()).get('/health/live');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
    expect(response.headers['content-security-policy']).toContain("default-src 'none'");
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('omits HSTS outside production', async () => {
    const response = await request(appWith()).get('/health/live');
    expect(response.headers['strict-transport-security']).toBeUndefined();
  });
});

describe('CORS', () => {
  it('allows a configured origin and sets no wildcard', async () => {
    const response = await request(appWith())
      .get('/health/live')
      .set('Origin', 'http://localhost:3000');

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('does not authorise an unknown origin', async () => {
    const response = await request(appWith())
      .get('/health/live')
      .set('Origin', 'https://evil.example');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('answers preflight requests', async () => {
    const response = await request(appWith())
      .options('/api/v1')
      .set('Origin', 'http://localhost:3000');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-methods']).toContain('POST');
  });
});
