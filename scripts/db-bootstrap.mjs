/**
 * Database bootstrap — roles, databases and privileges.
 *
 * Creates the three-role model from docs/SECURITY_PLAN.md:
 *
 *   gaushala_owner  owns the schema; used only by the Prisma CLI (DDL)
 *   gaushala_app    runtime role: SELECT/INSERT/UPDATE/DELETE only, no DDL
 *   postgres        superuser; used only by this script
 *
 * Both the development and test databases are created, because integration
 * tests must never run against the development database. Configuration is read
 * from `apps/api/.env` and `apps/api/.env.test`; in CI the same variables come
 * from the job environment.
 *
 * Idempotent: safe to run on every setup and in CI.
 *
 * Usage:
 *   pnpm db:bootstrap
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import pg from 'pg';

import { parseEnvFile } from './load-env.mjs';

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiDirectory = path.join(rootDirectory, 'apps', 'api');

function readEnvFile(fileName) {
  const file = path.join(apiDirectory, fileName);
  return existsSync(file) ? parseEnvFile(readFileSync(file, 'utf8')) : {};
}

const devEnv = readEnvFile('.env');
const testEnv = readEnvFile('.env.test');

function pick(...values) {
  return values.find((value) => typeof value === 'string' && value.length > 0);
}

const environments = [
  {
    label: 'development',
    adminUrl: pick(devEnv.ADMIN_DATABASE_URL, process.env.ADMIN_DATABASE_URL),
    ownerUrl: pick(devEnv.MIGRATE_DATABASE_URL, process.env.MIGRATE_DATABASE_URL),
    appUrl: pick(devEnv.DATABASE_URL, process.env.DATABASE_URL),
  },
  {
    label: 'test',
    adminUrl: pick(testEnv.ADMIN_DATABASE_URL, process.env.ADMIN_DATABASE_URL),
    ownerUrl: pick(testEnv.MIGRATE_DATABASE_URL, process.env.TEST_MIGRATE_DATABASE_URL),
    appUrl: pick(testEnv.DATABASE_URL, process.env.TEST_DATABASE_URL),
  },
].filter((environment) => environment.ownerUrl !== undefined && environment.appUrl !== undefined);

if (environments.length === 0) {
  console.error(
    '[db-bootstrap] No MIGRATE_DATABASE_URL/DATABASE_URL pair found. ' +
      'Copy apps/api/.env.example to apps/api/.env first.',
  );
  process.exit(1);
}

const adminUrl = pick(process.env.ADMIN_DATABASE_URL, environments[0].adminUrl);
if (adminUrl === undefined) {
  console.error('[db-bootstrap] ADMIN_DATABASE_URL is required (superuser connection).');
  process.exit(1);
}

function parse(url, label) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    console.error(`[db-bootstrap] ${label} is not a valid URL`);
    process.exit(1);
  }
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  if (database.length === 0) {
    console.error(`[db-bootstrap] ${label} must include a database name`);
    process.exit(1);
  }
  return {
    database,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
  };
}

// Roles are shared by both databases; take them from the first environment.
const primaryOwner = parse(environments[0].ownerUrl, 'MIGRATE_DATABASE_URL');
const primaryApp = parse(environments[0].appUrl, 'DATABASE_URL');

const ownerRole = { user: primaryOwner.user, password: primaryOwner.password };
const appRole = { user: primaryApp.user, password: primaryApp.password };

const databases = [
  ...new Set(
    environments.flatMap((environment) => [
      parse(environment.ownerUrl, 'MIGRATE_DATABASE_URL').database,
      parse(environment.appUrl, 'DATABASE_URL').database,
    ]),
  ),
];

function ident(value) {
  return `"${value.replace(/"/g, '""')}"`;
}

function literal(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

async function createRole(client, name, password, { createdb = false } = {}) {
  const exists = await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [name]);

  if (exists.rowCount === 0) {
    await client.query(
      `CREATE ROLE ${ident(name)} WITH LOGIN PASSWORD ${literal(password)}` +
        (createdb ? ' CREATEDB' : ''),
    );
    console.info(`[db-bootstrap] created role ${name}`);
    return;
  }

  await client.query(
    `ALTER ROLE ${ident(name)} WITH LOGIN PASSWORD ${literal(password)}` +
      (createdb ? ' CREATEDB' : ' NOCREATEDB'),
  );
  console.info(`[db-bootstrap] role ${name} already exists (password synchronised)`);
}

async function createDatabase(client, name, ownerName) {
  const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);

  if (exists.rowCount === 0) {
    await client.query(`CREATE DATABASE ${ident(name)} OWNER ${ident(ownerName)}`);
    console.info(`[db-bootstrap] created database ${name}`);
    return;
  }

  console.info(`[db-bootstrap] database ${name} already exists`);
}

async function grantPrivileges(client, database) {
  await client.query('REVOKE CREATE ON SCHEMA public FROM PUBLIC');
  await client.query(`GRANT ALL ON SCHEMA public TO ${ident(ownerRole.user)} WITH GRANT OPTION`);
  await client.query(`GRANT USAGE ON SCHEMA public TO ${ident(appRole.user)}`);
  await client.query(`GRANT CONNECT ON DATABASE ${ident(database)} TO ${ident(appRole.user)}`);

  await client.query(
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${ident(appRole.user)}`,
  );
  await client.query(
    `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${ident(appRole.user)}`,
  );

  await client.query(
    `ALTER DEFAULT PRIVILEGES FOR ROLE ${ident(ownerRole.user)} IN SCHEMA public ` +
      `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${ident(appRole.user)}`,
  );
  await client.query(
    `ALTER DEFAULT PRIVILEGES FOR ROLE ${ident(ownerRole.user)} IN SCHEMA public ` +
      `GRANT USAGE, SELECT ON SEQUENCES TO ${ident(appRole.user)}`,
  );

  console.info(`[db-bootstrap] privileges configured in ${database}`);
}

async function main() {
  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();

  try {
    await createRole(admin, ownerRole.user, ownerRole.password, { createdb: true });
    await createRole(admin, appRole.user, appRole.password);

    for (const database of databases) {
      await createDatabase(admin, database, ownerRole.user);
    }
  } finally {
    await admin.end();
  }

  for (const database of databases) {
    const target = new URL(adminUrl);
    target.pathname = `/${database}`;

    const client = new pg.Client({ connectionString: target.toString() });
    await client.connect();
    try {
      await grantPrivileges(client, database);
    } finally {
      await client.end();
    }
  }

  console.info('[db-bootstrap] done');
  console.info('[db-bootstrap] next: pnpm db:migrate:all');
}

main().catch((error) => {
  console.error('[db-bootstrap] failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
