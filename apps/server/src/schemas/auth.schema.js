import { z } from 'zod';

export const loginSchema = z.object({
  ecode: z
    .string({ required_error: 'Employee code is required.' })
    .trim()
    .min(1, 'Employee code cannot be empty.')
    .max(20, 'Employee code must not exceed 20 characters.'),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(1, 'Password cannot be empty.')
    .max(100, 'Password must not exceed 100 characters.'),
});
