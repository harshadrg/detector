import { z } from 'zod';

export const createProcessSchema = z.object({
  vertical_id: z.number().int().positive({ message: 'Vertical ID is required and must be positive.' }),
  sbu_id: z.number().int().positive().nullable().optional(),
  wps_code: z.string().trim().max(100).nullable().optional(),
  process_name: z.string().trim().max(200).nullable().optional(),
  client_id: z.number().int().positive().nullable().optional(),
  client_type: z.string().trim().max(30).nullable().optional(),
  location_id: z.number().int().positive().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'TRANSITION', 'CLOSED']).default('TRANSITION'),
  status_reason: z.string().trim().max(255).nullable().optional(),
  started_on: z.string().datetime().nullable().optional().or(z.date().nullable().optional()),
  ended_on: z.string().datetime().nullable().optional().or(z.date().nullable().optional()),
  ops_head_ecode: z.string().trim().max(20).nullable().optional(),
  cbo_ecode: z.string().trim().max(20).nullable().optional(),
  sbu_head_ecode: z.string().trim().max(20).nullable().optional(),
  account_head_ecode: z.string().trim().max(20).nullable().optional(),
  pm_ecode: z.string().trim().max(20).nullable().optional(),
});

export const listProcessesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional().default(''),
  vertical_id: z.coerce.number().int().positive().nullable().optional(),
  sbu_id: z.coerce.number().int().positive().nullable().optional(),
  status: z.string().trim().optional().default('ALL'),
  client_type: z.string().trim().nullable().optional(),
  sortField: z.string().trim().optional().default('process_code'),
  sortDirection: z.enum(['ASC', 'DESC']).default('ASC'),
});
