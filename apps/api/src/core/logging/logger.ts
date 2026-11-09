import pino, { type DestinationStream, type Logger, type LoggerOptions } from 'pino';

import type { LogLevel } from '../config/env.js';

/**
 * Structured logging (ADR-014).
 *
 * Rules enforced here:
 *  - one JSON object per line in every non-development environment;
 *  - sensitive fields are redacted at the logger level, so a careless
 *    `logger.info({ req })` cannot leak a cookie or a token;
 *  - request IDs are attached through child loggers, not string concatenation.
 */

/** Fields that must never appear in a log line, at any nesting depth. */
export const REDACTED_PATHS: readonly string[] = [
  'req.headers.cookie',
  'req.headers.authorization',
  'req.headers["x-csrf-token"]',
  'res.headers["set-cookie"]',
  'password',
  'newPassword',
  'currentPassword',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'csrfToken',
  'sessionToken',
  'secret',
  'apiKey',
  'databaseUrl',
  'connectionString',
  'pan',
  'donorPan',
  'authorization',
  'cookie',
  '*.password',
  '*.newPassword',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.csrfToken',
  '*.secret',
  '*.apiKey',
  '*.cookie',
  '*.authorization',
  '*.pan',
  '*.donorPan',
  '*.passwordHash',
  '*.databaseUrl',
];

export const REDACTION_CENSOR = '[REDACTED]';

export interface CreateLoggerOptions {
  level: LogLevel;
  /** Human-readable output for local development only; never in production. */
  pretty?: boolean;
  service?: string;
  version?: string;
  /** Injection point for tests. */
  stream?: DestinationStream;
  isProduction?: boolean;
}

export function createLogger(options: CreateLoggerOptions): Logger {
  const { level, pretty = false, service, version, stream, isProduction = false } = options;

  const config: LoggerOptions = {
    level,
    base: {
      service: service ?? 'gaushala-api',
      ...(version === undefined ? {} : { version }),
      pid: process.pid,
    },
    redact: {
      paths: [...REDACTED_PATHS],
      censor: REDACTION_CENSOR,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
    serializers: {
      err: pino.stdSerializers.err,
    },
  };

  // pino-pretty is a development convenience; producing JSON in production is a
  // requirement (acceptance criterion 2.7), not a preference.
  if (pretty && !isProduction) {
    config.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss.l',
        ignore: 'pid,hostname,service',
        singleLine: false,
      },
    };
  }

  return stream === undefined ? pino(config) : pino(config, stream);
}

/** Child logger bound to a request. */
export function withRequestId(logger: Logger, requestId: string): Logger {
  return logger.child({ requestId });
}
