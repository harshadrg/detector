import { z } from 'zod';

export const queryAuditSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  module_code: z.string().trim().optional(),
  entity_type: z.string().trim().optional(),
  entity_id: z.string().trim().optional(),
  action: z.string().trim().optional(),
  performed_by: z.string().trim().optional(),
  acting_context: z.string().trim().optional(),
  search: z.string().trim().optional(),
});
