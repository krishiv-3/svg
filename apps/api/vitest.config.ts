import { defineConfig } from 'vitest/config';

/**
 * Unit tests: fast, no infrastructure. Everything that needs PostgreSQL lives
 * in `vitest.integration.config.ts`.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.integration.test.ts'],
    reporters: ['default'],
    passWithNoTests: false,
  },
});
