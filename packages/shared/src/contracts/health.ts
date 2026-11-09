import { z } from 'zod';

/** Identifies this service in health and error payloads. */
export const SERVICE_NAME = 'gaushala-api' as const;

export const checkStatusSchema = z.enum(['up', 'down', 'skipped']);
export type CheckStatus = z.infer<typeof checkStatusSchema>;

export const serviceStatusSchema = z.enum(['ok', 'degraded', 'error']);
export type ServiceStatus = z.infer<typeof serviceStatusSchema>;

export const dependencyCheckSchema = z.object({
  status: checkStatusSchema,
  latencyMs: z.number().nonnegative().optional(),
  detail: z.string().optional(),
});
export type DependencyCheck = z.infer<typeof dependencyCheckSchema>;

export const migrationsCheckSchema = z.object({
  status: checkStatusSchema,
  applied: z.number().int().nonnegative().optional(),
  pending: z.number().int().nonnegative().optional(),
  detail: z.string().optional(),
});
export type MigrationsCheck = z.infer<typeof migrationsCheckSchema>;

const baseResponseFields = {
  service: z.literal(SERVICE_NAME),
  version: z.string().min(1),
  environment: z.string().min(1),
  timestamp: z.iso.datetime(),
  uptimeSeconds: z.number().nonnegative(),
};

/** `GET /health/live` — process liveness only; never touches a dependency. */
export const livenessResponseSchema = z.object({
  ...baseResponseFields,
  status: z.literal('ok'),
});
export type LivenessResponse = z.infer<typeof livenessResponseSchema>;

/** `GET /health/ready` — dependency and migration readiness. */
export const readinessResponseSchema = z.object({
  ...baseResponseFields,
  status: serviceStatusSchema,
  checks: z.object({
    database: dependencyCheckSchema,
    migrations: migrationsCheckSchema,
  }),
});
export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;

/** `GET /version` — build provenance for operators. */
export const versionResponseSchema = z.object({
  service: z.literal(SERVICE_NAME),
  version: z.string().min(1),
  environment: z.string().min(1),
  nodeVersion: z.string().min(1),
  gitSha: z.string().nullable(),
  startedAt: z.iso.datetime(),
});
export type VersionResponse = z.infer<typeof versionResponseSchema>;

/** `GET /api/v1` — discovery payload for humans and tooling. */
export const apiIndexResponseSchema = z.object({
  name: z.literal(SERVICE_NAME),
  version: z.string().min(1),
  environment: z.string().min(1),
  docs: z.string().nullable(),
});
export type ApiIndexResponse = z.infer<typeof apiIndexResponseSchema>;
