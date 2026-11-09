import { existsSync } from 'node:fs';

import { config as loadEnv } from 'dotenv';

/**
 * Integration test environment.
 *
 * Prefers `apps/api/.env.test` (the documented test configuration) and falls
 * back to whatever the CI job exports. `.env` is never used here: integration
 * tests must never touch the development database by accident.
 */
const testEnvFile = '.env.test';

if (existsSync(testEnvFile)) {
  loadEnv({ path: testEnvFile, override: true });
}

if (typeof process.env.DATABASE_URL !== 'string' || process.env.DATABASE_URL.length === 0) {
  throw new Error(
    'Integration tests need DATABASE_URL. Copy apps/api/.env.test.example to apps/api/.env.test ' +
      'and run `pnpm db:setup` first. See docs/DEVELOPMENT.md.',
  );
}
