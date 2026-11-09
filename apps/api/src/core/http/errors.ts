import type { ErrorCode, FieldError } from '@gaushala/shared';

/**
 * Typed application errors.
 *
 * Every route throws one of these (or lets a ZodError bubble) and the central
 * error handler turns it into an RFC 9457 problem document. Nothing else
 * reaches the client — internal messages and stack traces never do.
 */

export interface AppErrorOptions {
  /** Safe, human-readable explanation shown to the client. */
  detail?: string;
  /** Field-level errors for validation failures. */
  errors?: FieldError[];
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly clientDetail: string | undefined;
  readonly fieldErrors: FieldError[] | undefined;

  constructor(code: ErrorCode, status: number, message: string, options: AppErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.clientDetail = options.detail;
    this.fieldErrors = options.errors;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Request validation failed', errors?: FieldError[]) {
    super('VALIDATION_FAILED', 422, message, errors === undefined ? {} : { errors });
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super('NOT_FOUND', 404, message, { detail: 'The requested resource does not exist.' });
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super('UNAUTHENTICATED', 401, message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Permission denied') {
    super('FORBIDDEN', 403, message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(code: ErrorCode = 'INVALID_STATE_TRANSITION', message = 'Conflict') {
    super(code, 409, message);
    this.name = 'ConflictError';
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable', detail?: string) {
    super('DEPENDENCY_UNAVAILABLE', 503, message, detail === undefined ? {} : { detail });
    this.name = 'ServiceUnavailableError';
  }
}
