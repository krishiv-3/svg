/**
 * Local PostgreSQL without Docker.
 *
 * Some development machines (and CI-less sandboxes) have no Docker daemon.
 * `embedded-postgres` ships real PostgreSQL binaries as an npm dependency, so we
 * can run an actual server — not an emulator — with the same connection strings
 * the Docker path uses.
 *
 * Data lives in `.local/pgdata` (git-ignored) and survives restarts.
 *
 * Usage:
 *   pnpm db:start | pnpm db:stop | pnpm db:status
 */
import { existsSync } from 'node:fs';
import { createConnection } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDirectory = path.join(rootDirectory, '.local', 'pgdata');
const port = Number(process.env.PGPORT ?? 5432);
const host = '127.0.0.1';

function log(message) {
  console.info(`[dev-db] ${message}`);
}

function isPortOpen() {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port });
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(1_000);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

async function loadEmbeddedPostgres() {
  const module = await import('embedded-postgres');
  return module.default ?? module;
}

function createInstance(EmbeddedPostgres) {
  return new EmbeddedPostgres({
    databaseDir: dataDirectory,
    user: 'postgres',
    password: 'postgres',
    port,
    persistent: true,
  });
}

async function waitForServer(timeoutMs = 30_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isPortOpen()) return true;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function start() {
  if (await isPortOpen()) {
    log(`PostgreSQL is already accepting connections on ${host}:${port}`);
    return;
  }

  const EmbeddedPostgres = await loadEmbeddedPostgres();
  const instance = createInstance(EmbeddedPostgres);

  const firstRun = !existsSync(path.join(dataDirectory, 'PG_VERSION'));
  if (firstRun) {
    log(`initialising a new data directory at ${dataDirectory}`);
    await instance.initialise();
  }

  log('starting PostgreSQL (this can take a few seconds on first run)');
  await instance.start();

  if (!(await waitForServer())) {
    throw new Error(`PostgreSQL did not accept connections on ${host}:${port}`);
  }

  log(`ready on postgresql://postgres:postgres@${host}:${port}/postgres`);
  log('next: pnpm db:bootstrap && pnpm db:migrate:all && pnpm db:seed');
}

async function stop() {
  if (!existsSync(path.join(dataDirectory, 'PG_VERSION'))) {
    log('no local data directory; nothing to stop');
    return;
  }

  const EmbeddedPostgres = await loadEmbeddedPostgres();
  const instance = createInstance(EmbeddedPostgres);

  try {
    await instance.stop();
    log('stopped');
  } catch (error) {
    log(`stop reported: ${error instanceof Error ? error.message : String(error)}`);
    log('if the server is still running, stop it with pg_ctl or your task manager');
  }
}

async function status() {
  const running = await isPortOpen();
  log(`data directory: ${dataDirectory}`);
  log(`server: ${running ? `running on ${host}:${port}` : 'not running'}`);
  process.exitCode = running ? 0 : 1;
}

/**
 * Keep the server in the foreground.
 *
 * Useful in environments that tear down child processes when the launching
 * command exits (containers, sandboxes): run this as a long-lived process and
 * the database stays available for every other command.
 */
async function serve() {
  await start();
  log('serving in the foreground; terminate this process to stop PostgreSQL');

  const shutdown = () => {
    log('shutting down');
    process.exit(0);
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  // Never resolves: the spawned server keeps the process alive.
  await new Promise(() => {});
}

const command = process.argv[2];

try {
  switch (command) {
    case 'start':
      await start();
      // `embedded-postgres` keeps a handle on the spawned server, which would
      // keep this process alive forever. The server is detached, so exit.
      process.exit(0);
      break;
    case 'serve':
      await serve();
      break;
    case 'stop':
      await stop();
      process.exit(process.exitCode ?? 0);
      break;
    case 'status':
      await status();
      process.exit(process.exitCode ?? 0);
      break;
    default:
      console.error('Usage: node scripts/dev-db.mjs <start|serve|stop|status>');
      process.exit(1);
  }
} catch (error) {
  console.error('[dev-db] failed:', error instanceof Error ? error.message : error);
  process.exit(1);
}
