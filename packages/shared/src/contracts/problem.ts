import { z } from 'zod';

/**
 * RFC 9457 problem details — the single error shape every API route returns
 * (docs/API_DESIGN.md §5). Client code switches on `code`, never on prose.
 */
export const errorCodeSchema = z.enum([
  'VALIDATION_FAILED',
  'MALFORMED_REQUEST',
  'UNSUPPORTED_MEDIA_TYPE',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA',
  'UNAUTHENTICATED',
  'SESSION_EXPIRED',
  'MFA_REQUIRED',
  'FORBIDDEN',
  'CSRF_TOKEN_INVALID',
  'ORIGIN_NOT_ALLOWED',
  'NOT_FOUND',
  'METHOD_NOT_ALLOWED',
  'SLUG_TAKEN',
  'VERSION_CONFLICT',
  'INVALID_STATE_TRANSITION',
  'MEDIA_IN_USE',
  'IDEMPOTENCY_KEY_REUSED',
  'DUPLICATE_RESOURCE',
  'ACCOUNT_LOCKED',
  'RATE_LIMITED',
  'PRECONDITION_REQUIRED',
  'PAYMENT_PROVIDER_DISABLED',
  'PAYMENT_PROVIDER_UNAVAILABLE',
  'DONATION_NOT_PAYABLE',
  'RECEIPT_NOT_ISSUABLE',
  'DEPENDENCY_UNAVAILABLE',
  'MAINTENANCE_MODE',
  'INTERNAL_ERROR',
]);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

export const fieldErrorSchema = z.object({
  path: z.string(),
  code: z.string(),
  message: z.string(),
});
export type FieldError = z.infer<typeof fieldErrorSchema>;

export const problemDetailsSchema = z.object({
  /** Stable URI identifying the problem type. */
  type: z.string().min(1),
  title: z.string().min(1),
  status: z.number().int().min(400).max(599),
  detail: z.string().optional(),
  instance: z.string().optional(),
  code: errorCodeSchema,
  requestId: z.string().optional(),
  errors: z.array(fieldErrorSchema).optional(),
});
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;

/** Content type mandated by RFC 9457. */
export const PROBLEM_CONTENT_TYPE = 'application/problem+json' as const;
