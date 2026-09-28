import { z } from 'zod';

export const createEmployeeSchema = z.object({
  ecode: z
    .string({ required_error: 'Employee code is required.' })
    .trim()
    .min(2, 'Employee code must be at least 2 characters.')
    .max(20, 'Employee code must not exceed 20 characters.')
    .transform((val) => val.toUpperCase()),
  name: z
    .string({ required_error: 'Full name is required.' })
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name must not exceed 100 characters.'),
  email: z
    .string({ required_error: 'Corporate email is required.' })
    .trim()
    .email('Invalid email address format.')
    .max(150, 'Email must not exceed 150 characters.')
    .toLowerCase(),
  password: z
    .string()
    .min(6, 'Initial password must be at least 6 characters.')
    .max(100, 'Password must not exceed 100 characters.')
    .optional()
    .default('Welcome@Detector2026!'),
  role_codes: z.array(z.string()).optional().default([]),
});

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    errorMap: () => ({ message: "Status must be either 'ACTIVE' or 'INACTIVE'." }),
  }),
});

export const assignRoleSchema = z.object({
  ecode: z
    .string({ required_error: 'Target employee code is required.' })
    .trim()
    .min(1)
    .max(20),
  role_code: z
    .string({ required_error: 'Role code is required.' })
    .trim()
    .min(1)
    .max(50),
  action: z.enum(['ASSIGN', 'REVOKE'], {
    errorMap: () => ({ message: "Action must be either 'ASSIGN' or 'REVOKE'." }),
  }),
});

export const listEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(['ALL', 'ACTIVE', 'INACTIVE']).default('ALL'),
  search: z.string().trim().optional().default(''),
});
