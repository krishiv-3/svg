import { z } from 'zod';

/**
 * Environment configuration — validated once, at startup, with Zod.
 *
 * The process refuses to boot on missing or malformed values (acceptance
 * criterion 2.6). Two safety rules matter most:
 *
 *  1. A database URL that looks local cannot be used in production.
 *  2. A test environment cannot point at anything except a `*_test` database.
 *
 * The parser is pure so it can be unit tested without touching `process.env`.
 */

export const APP_ENVS = ['development', 'test', 'staging', 'production'] as const;
export type AppEnv = (typeof APP_ENVS)[number];

export const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

const booleanish = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1');

const csvList = z.string().transform((value) =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0),
);

const rawEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ENV: z.enum(APP_ENVS).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  HOST: z.string().min(1).default('0.0.0.0'),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
  LOG_PRETTY: booleanish.optional(),
  TRUST_PROXY: booleanish.optional(),
  /** Runtime role: SELECT/INSERT/UPDATE/DELETE only. Never DDL. */
  DATABASE_URL: z.string().min(1),
  /** Owner role: used only by the Prisma CLI for migrations. */
  MIGRATE_DATABASE_URL: z.string().min(1).optional(),
  CORS_ORIGINS: csvList.optional(),
  SITE_URL: z.url().default('http://localhost:3000'),
  APP_VERSION: z.string().min(1).default('0.0.0-dev'),
  GIT_SHA: z.string().min(1).optional(),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().min(0).max(60_000).default(10_000),
});

const LOCAL_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '0.0.0.0',
  'host.docker.internal',
  'postgres',
  'db',
]);

interface ParsedDatabaseUrl {
  hostname: string;
  database: string;
  usesSsl: boolean;
}

function parseDatabaseUrl(value: string): ParsedDatabaseUrl | null {
  if (!/^postgres(ql)?:\/\//i.test(value)) {
    return null;
  }
  try {
    const url = new URL(value);
    const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
    if (database.length === 0) {
      return null;
    }
    return {
      hostname: url.hostname.toLowerCase(),
      database,
      usesSsl: /(?:^|[?&])sslmode=(?:require|verify-ca|verify-full)/i.test(url.search),
    };
  } catch {
    return null;
  }
}

export interface ServerEnv {
  nodeEnv: 'development' | 'test' | 'production';
  appEnv: AppEnv;
  isProduction: boolean;
  isTest: boolean;
  port: number;
  host: string;
  logLevel: LogLevel;
  logPretty: boolean;
  trustProxy: boolean;
  databaseUrl: string;
  migrateDatabaseUrl: string | undefined;
  corsOrigins: string[];
  siteUrl: string;
  version: string;
  gitSha: string | null;
  shutdownTimeoutMs: number;
}

export class EnvValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(
      `Invalid environment configuration:\n${issues.map((issue) => `  - ${issue}`).join('\n')}\n\n` +
        'Copy apps/api/.env.example to apps/api/.env and fill in the required values. ' +
        'See docs/DEVELOPMENT.md.',
    );
    this.name = 'EnvValidationError';
    this.issues = issues;
  }
}

/**
 * Validate raw environment variables.
 *
 * @throws EnvValidationError listing every problem (never the secret values).
 */
export function parseEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = rawEnvSchema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const path = issue.path.join('.') || '(root)';
      return `${path}: ${issue.message}`;
    });
    throw new EnvValidationError(issues);
  }

  const parsed = result.data;
  const problems: string[] = [];

  const db = parseDatabaseUrl(parsed.DATABASE_URL);
  if (db === null) {
    problems.push(
      'DATABASE_URL: must be a valid postgresql:// URL including a database name (value not shown)',
    );
  }

  if (db !== null) {
    const isLocal = LOCAL_HOSTNAMES.has(db.hostname);

    if (parsed.APP_ENV === 'production' && isLocal) {
      problems.push(
        `DATABASE_URL: refusing a local host ("${db.hostname}") when APP_ENV=production`,
      );
    }

    if (parsed.APP_ENV === 'production' && parsed.NODE_ENV !== 'production') {
      problems.push('NODE_ENV: must be "production" when APP_ENV=production');
    }

    if (parsed.APP_ENV === 'test' && !db.database.endsWith('_test')) {
      problems.push(
        `DATABASE_URL: test environments must use a database ending in "_test" (got "${db.database}")`,
      );
    }

    if (parsed.APP_ENV !== 'production' && /prod/i.test(db.database)) {
      problems.push(
        `DATABASE_URL: database name "${db.database}" looks like production; refusing to run in ${parsed.APP_ENV}`,
      );
    }

    if (parsed.APP_ENV === 'staging' && isLocal) {
      problems.push('DATABASE_URL: staging must not point at a local database');
    }
  }

  if (parsed.APP_ENV === 'production' && parsed.SITE_URL.startsWith('http://')) {
    problems.push('SITE_URL: production must use https://');
  }

  if (problems.length > 0) {
    throw new EnvValidationError(problems);
  }

  return {
    nodeEnv: parsed.NODE_ENV,
    appEnv: parsed.APP_ENV,
    isProduction: parsed.APP_ENV === 'production',
    isTest: parsed.APP_ENV === 'test' || parsed.NODE_ENV === 'test',
    port: parsed.PORT,
    host: parsed.HOST,
    logLevel: parsed.LOG_LEVEL,
    logPretty: parsed.LOG_PRETTY ?? false,
    trustProxy: parsed.TRUST_PROXY ?? false,
    databaseUrl: parsed.DATABASE_URL,
    migrateDatabaseUrl: parsed.MIGRATE_DATABASE_URL,
    corsOrigins: parsed.CORS_ORIGINS ?? ['http://localhost:3000'],
    siteUrl: parsed.SITE_URL,
    version: parsed.APP_VERSION,
    gitSha: parsed.GIT_SHA ?? null,
    shutdownTimeoutMs: parsed.SHUTDOWN_TIMEOUT_MS,
  };
}

let cached: ServerEnv | null = null;

/** Memoised accessor used by modules that cannot receive config explicitly. */
export function getEnv(): ServerEnv {
  cached ??= parseEnv(process.env);
  return cached;
}

/** Test helper: forget the memoised configuration. */
export function resetEnvCache(): void {
  cached = null;
}
