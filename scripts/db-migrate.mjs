/**
 * Apply Prisma migrations to the development and test databases.
 *
 * The Prisma CLI is executed with an explicit `MIGRATE_DATABASE_URL` override so
 * one command can migrate both databases without touching `.env`.
 *
 * Usage:
 *   pnpm db:migrate:all
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseEnvFile } from './load-env.mjs';

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiDirectory = path.join(rootDirectory, 'apps', 'api');

function readEnvFile(fileName) {
  const file = path.join(apiDirectory, fileName);
  if (!existsSync(file)) return {};
  return parseEnvFile(readFileSync(file, 'utf8'));
}

const devEnv = readEnvFile('.env');
const testEnv = readEnvFile('.env.test');

const targets = [];
const seen = new Set();

function addTarget(label, url) {
  if (typeof url !== 'string' || url.length === 0 || seen.has(url)) return;
  seen.add(url);
  targets.push({ label, url });
}

addTarget('development', devEnv.MIGRATE_DATABASE_URL ?? process.env.MIGRATE_DATABASE_URL);
addTarget(
  'test',
  testEnv.MIGRATE_DATABASE_URL ??
    devEnv.TEST_MIGRATE_DATABASE_URL ??
    process.env.TEST_MIGRATE_DATABASE_URL,
);

if (targets.length === 0) {
  console.error(
    '[db-migrate] No MIGRATE_DATABASE_URL found. Copy apps/api/.env.example to apps/api/.env first.',
  );
  process.exit(1);
}

const require = createRequire(path.join(apiDirectory, 'package.json'));
const prismaPackage = JSON.parse(readFileSync(require.resolve('prisma/package.json'), 'utf8'));
const binEntry =
  typeof prismaPackage.bin === 'string' ? prismaPackage.bin : prismaPackage.bin?.prisma;

if (typeof binEntry !== 'string') {
  console.error('[db-migrate] Could not locate the Prisma CLI entry point.');
  process.exit(1);
}

const cliPath = require.resolve(`prisma/${binEntry.replace(/^\.\//, '')}`);

for (const target of targets) {
  console.info(`[db-migrate] applying migrations to the ${target.label} database`);

  const result = spawnSync(process.execPath, [cliPath, 'migrate', 'deploy'], {
    cwd: apiDirectory,
    stdio: 'inherit',
    env: { ...process.env, MIGRATE_DATABASE_URL: target.url },
  });

  if (result.status !== 0) {
    console.error(`[db-migrate] migrations failed for the ${target.label} database`);
    process.exit(result.status ?? 1);
  }
}

console.info('[db-migrate] done');
