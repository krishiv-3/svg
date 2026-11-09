import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/**
 * Prisma CLI configuration (Prisma 7).
 *
 * The CLI (migrations, generate, seed) connects with the **owner** role, while
 * the running application connects with the least-privilege `gaushala_app`
 * role via `DATABASE_URL`. Keeping them separate means the API process cannot
 * run DDL, even if it is compromised.
 *
 * `.env` must exist before any `prisma` command runs.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('MIGRATE_DATABASE_URL'),
  },
});
