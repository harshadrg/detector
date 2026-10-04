import { z } from 'zod';

export const listBatchesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

export const getStagedRowsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  filter: z.enum(['ALL', 'VALID', 'ERROR']).default('ALL'),
});
