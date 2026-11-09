import { z } from 'zod';

import { NotFoundError } from '../../../core/http/errors.js';
import type { EnquiryRepository } from '../repositories/enquiry.repository.js';

/**
 * Enquiry reads (internal).
 *
 * There is no `create` on this service. Accepting a submission requires CSRF,
 * rate limiting and spam controls that arrive with the security phase; leaving
 * the capability absent is deliberate.
 */

const statusValues = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'SPAM', 'ARCHIVED'] as const;
const typeValues = [
  'CONTACT',
  'VOLUNTEER',
  'VISIT',
  'EVENT_REGISTRATION',
  'DONATION_SUPPORT',
  'GENERAL',
] as const;

const listInputSchema = z.object({
  status: z.enum(statusValues).optional(),
  type: z.enum(typeValues).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

const idSchema = z.uuid();

export interface EnquiryListResult {
  readonly items: ReadonlyArray<{
    id: string;
    reference: string;
    type: string;
    name: string;
    email: string;
    subject: string | null;
    status: string;
    createdAt: string;
    assignedToId: string | null;
  }>;
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
}

export function createEnquiryService(repository: EnquiryRepository) {
  return {
    async list(input: unknown = {}): Promise<EnquiryListResult> {
      const query = listInputSchema.parse(input ?? {});
      const { rows, total } = await repository.list(query);

      return {
        items: rows.map((row) => ({
          id: row.id,
          reference: row.reference,
          type: row.type,
          name: row.name,
          email: row.email,
          subject: row.subject,
          status: row.status,
          createdAt: row.createdAt.toISOString(),
          assignedToId: row.assignedToId,
        })),
        total,
        limit: query.limit,
        offset: query.offset,
      };
    },

    async getById(id: string) {
      const validId = idSchema.safeParse(id);

      if (!validId.success) {
        throw new NotFoundError('Enquiry not found');
      }

      const row = await repository.findById(validId.data);

      if (row === null) {
        throw new NotFoundError('Enquiry not found');
      }

      return {
        id: row.id,
        reference: row.reference,
        type: row.type,
        name: row.name,
        email: row.email,
        phone: row.phone,
        subject: row.subject,
        message: row.message,
        status: row.status,
        consentGivenAt: row.consentGivenAt.toISOString(),
        consentVersion: row.consentVersion,
        sourcePath: row.sourcePath,
        retentionDeleteAt: row.retentionDeleteAt?.toISOString() ?? null,
        assignedToId: row.assignedToId,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    },

    async counts(): Promise<ReadonlyArray<{ status: string; count: number }>> {
      return repository.countByStatus();
    },
  };
}

export type EnquiryService = ReturnType<typeof createEnquiryService>;
