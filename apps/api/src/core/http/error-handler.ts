import type { ErrorRequestHandler, Request } from 'express';
import type { Logger } from 'pino';
import { ZodError } from 'zod';

import {
  PROBLEM_CONTENT_TYPE,
  type ErrorCode,
  type FieldError,
  type ProblemDetails,
} from '@gaushala/shared';

import { AppError } from './errors.js';

/**
 * Central error handling.
 *
 * Guarantees:
 *  - every error becomes an RFC 9457 problem document;
 *  - unknown errors never leak implementation details in production;
 *  - the underlying error is logged server-side with the request id, so
 *    operators can correlate without exposing anything to the caller.
 */

const PROBLEM_TITLES: Record<ErrorCode, string> = {
  VALIDATION_FAILED: 'Request validation failed',
  MALFORMED_REQUEST: 'Malformed request',
  UNSUPPORTED_MEDIA_TYPE: 'Unsupported media type',
  PAYLOAD_TOO_LARGE: 'Payload too large',
  UNSUPPORTED_MEDIA: 'Unsupported media',
  UNAUTHENTICATED: 'Authentication required',
  SESSION_EXPIRED: 'Session expired',
  MFA_REQUIRED: 'Multi-factor authentication required',
  FORBIDDEN: 'Permission denied',
  CSRF_TOKEN_INVALID: 'Invalid CSRF token',
  ORIGIN_NOT_ALLOWED: 'Origin not allowed',
  NOT_FOUND: 'Resource not found',
  METHOD_NOT_ALLOWED: 'Method not allowed',
  SLUG_TAKEN: 'Slug already in use',
  VERSION_CONFLICT: 'Version conflict',
  INVALID_STATE_TRANSITION: 'Invalid state transition',
  MEDIA_IN_USE: 'Media is in use',
  IDEMPOTENCY_KEY_REUSED: 'Idempotency key reused with a different request',
  DUPLICATE_RESOURCE: 'Resource already exists',
  ACCOUNT_LOCKED: 'Account locked',
  RATE_LIMITED: 'Too many requests',
  PRECONDITION_REQUIRED: 'Precondition required',
  PAYMENT_PROVIDER_DISABLED: 'Online donations are currently disabled',
  PAYMENT_PROVIDER_UNAVAILABLE: 'Payment provider unavailable',
  DONATION_NOT_PAYABLE: 'Donation cannot be paid',
  RECEIPT_NOT_ISSUABLE: 'Receipt cannot be issued',
  DEPENDENCY_UNAVAILABLE: 'Service temporarily unavailable',
  MAINTENANCE_MODE: 'Site is under maintenance',
  INTERNAL_ERROR: 'Internal server error',
};

function problemType(code: ErrorCode): string {
  return `urn:gaushala:problem:${code.toLowerCase().replace(/_/g, '-')}`;
}

interface BodyParserErrorLike {
  type?: unknown;
  status?: unknown;
  statusCode?: unknown;
  expose?: unknown;
}

function bodyParserStatus(error: unknown): { status: number; code: ErrorCode } | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }
  const candidate = error as BodyParserErrorLike;
  switch (candidate.type) {
    case 'entity.too.large':
      return { status: 413, code: 'PAYLOAD_TOO_LARGE' };
    case 'entity.parse.failed':
      return { status: 400, code: 'MALFORMED_REQUEST' };
    case 'charset.unsupported':
    case 'encoding.unsupported':
      return { status: 415, code: 'UNSUPPORTED_MEDIA_TYPE' };
    default:
      return null;
  }
}

function zodFieldErrors(error: ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    path: issue.path.map((segment) => String(segment)).join('.') || '(root)',
    code: issue.code.toUpperCase(),
    message: issue.message,
  }));
}

export interface ProblemMappingOptions {
  isProduction: boolean;
}

export interface ProblemMapping {
  status: number;
  problem: ProblemDetails;
  /** Server-side message for the log line; never sent to the client. */
  logMessage: string;
  loggedAsError: boolean;
}

export function mapError(
  error: unknown,
  request: Request,
  options: ProblemMappingOptions,
): ProblemMapping {
  const instance = request.originalUrl ?? request.url;
  const requestId = typeof request.id === 'string' ? request.id : undefined;

  const build = (
    status: number,
    code: ErrorCode,
    logMessage: string,
    extra: { detail?: string; errors?: FieldError[] } = {},
  ): ProblemMapping => ({
    status,
    problem: {
      type: problemType(code),
      title: PROBLEM_TITLES[code],
      status,
      code,
      instance,
      ...(requestId === undefined ? {} : { requestId }),
      ...(extra.detail === undefined ? {} : { detail: extra.detail }),
      ...(extra.errors === undefined ? {} : { errors: extra.errors }),
    },
    logMessage,
    loggedAsError: status >= 500,
  });

  if (error instanceof AppError) {
    return build(error.status, error.code, error.message, {
      ...(error.clientDetail === undefined ? {} : { detail: error.clientDetail }),
      ...(error.fieldErrors === undefined ? {} : { errors: error.fieldErrors }),
    });
  }

  if (error instanceof ZodError) {
    return build(422, 'VALIDATION_FAILED', 'Request validation failed', {
      detail: 'One or more fields need attention.',
      errors: zodFieldErrors(error),
    });
  }

  const parser = bodyParserStatus(error);
  if (parser !== null) {
    return build(parser.status, parser.code, `Body parser rejected the request (${parser.code})`);
  }

  const message = error instanceof Error ? error.message : 'Unknown error';

  // Unexpected failure: generic message in production, the real one locally.
  return build(500, 'INTERNAL_ERROR', message, {
    detail: options.isProduction
      ? 'An unexpected error occurred. Please try again later.'
      : message,
  });
}

export function createErrorHandler(options: {
  logger: Logger;
  isProduction: boolean;
}): ErrorRequestHandler {
  return (error, request, response, next) => {
    if (response.headersSent) {
      next(error);
      return;
    }

    const { status, problem, logMessage, loggedAsError } = mapError(error, request, {
      isProduction: options.isProduction,
    });

    const logPayload = {
      requestId: problem.requestId,
      status,
      code: problem.code,
      method: request.method,
      path: request.originalUrl,
      err: error,
    };

    if (loggedAsError) {
      options.logger.error(logPayload, logMessage);
    } else {
      options.logger.warn(logPayload, logMessage);
    }

    response
      .status(status)
      .type(PROBLEM_CONTENT_TYPE)
      .setHeader('Cache-Control', 'no-store')
      .json(problem);
  };
}
