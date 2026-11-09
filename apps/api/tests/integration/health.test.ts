import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';

import {
  PROBLEM_CONTENT_TYPE,
  livenessResponseSchema,
  problemDetailsSchema,
  readinessResponseSchema,
  versionResponseSchema,
} from '@gaushala/shared';

import { createApp } from '../../src/app.js';
import { createLogger } from '../../src/core/logging/logger.js';
import { appClient, testEnv } from './helpers.js';

const config = testEnv();
const prisma = appClient();
const app = createApp({ config, logger: createLogger({ level: 'silent' }), prisma });

afterAll(async () => {
  await prisma.$disconnect();
});

describe('health endpoints against a real database', () => {
  it('reports liveness', async () => {
    const response = await request(app).get('/health/live');
    expect(response.status).toBe(200);
    expect(() => livenessResponseSchema.parse(response.body)).not.toThrow();
  });

  it('reports readiness with the database up and migrations applied', async () => {
    const response = await request(app).get('/health/ready');

    expect(response.status).toBe(200);
    const body = readinessResponseSchema.parse(response.body);
    expect(body.status).toBe('ok');
    expect(body.checks.database.status).toBe('up');
    expect(body.checks.migrations.pending).toBe(0);
    expect(body.environment).toBe(config.appEnv);
  });

  it('reports the build version', async () => {
    const response = await request(app).get('/version');
    expect(response.status).toBe(200);
    expect(() => versionResponseSchema.parse(response.body)).not.toThrow();
  });

  it('serves the v1 index', async () => {
    const response = await request(app).get('/api/v1');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ name: 'gaushala-api' });
  });

  it('returns a problem document for unknown routes', async () => {
    const response = await request(app).get('/api/v1/nope');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toContain(PROBLEM_CONTENT_TYPE);
    expect(problemDetailsSchema.parse(response.body).code).toBe('NOT_FOUND');
  });

  it('hardens responses', async () => {
    const response = await request(app).get('/health/live');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-request-id']).toBeDefined();
  });
});
