import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/**
 * Prisma CLI configuration (Prisma 7).
 *
 * The CLI (migrations, seed) connects with the **owner** role, while the running
 * application connects with the least-privilege `gaushala_app` role via
 * `DATABASE_URL`. Keeping them separate means the API process cannot run DDL,
 * even if it is compromised.
 *
 * `prisma generate` reads the schema and writes a client; it never opens a
 * connection. CI runs it before any database exists, so requiring a real URL
 * there made generation fail for a connection it would not use. Generation may
 * therefore fall back to a placeholder that is structurally valid but unusable
 * outside localhost. Every command that actually touches a database (migrate,
 * db push, db execute, seed) still resolves the real variable through `env()`
 * and fails loudly when it is missing.
 */

const GENERATE_PLACEHOLDER =
  'postgresql://prisma_generate:prisma_generate@127.0.0.1:5432/prisma_generate';

function isGenerateOnly(): boolean {
  const command = process.argv.slice(2).find((argument) => !argument.startsWith('-'));

  if (command === undefined) return false;

  // `generate` / `gen` are the only connection-free commands. Anything else
  // (migrate, db, studio, validate against a live server) needs the real URL.
  return command === 'generate' || command === 'gen';
}

const datasourceUrl = isGenerateOnly()
  ? (process.env.MIGRATE_DATABASE_URL ?? GENERATE_PLACEHOLDER)
  : env('MIGRATE_DATABASE_URL');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: datasourceUrl,
  },
});
