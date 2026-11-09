import { defineConfig } from 'vitest/config';

/**
 * Integration tests: exercise real PostgreSQL, real migrations and the real
 * Express app. They never mock the database — that is the point.
 *
 * Requires the test database to exist:
 *   pnpm db:setup   (creates gaushala_test and applies migrations)
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['tests/setup.integration.ts'],
    reporters: ['default'],
    // Serial execution keeps database assertions deterministic.
    fileParallelism: false,
    sequence: { concurrent: false },
    testTimeout: 30_000,
    hookTimeout: 30_000,
    passWithNoTests: false,
  },
});
