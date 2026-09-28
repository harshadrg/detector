import { z } from 'zod';

export const createVerticalSchema = z.object({
  vertical_code: z
    .string({ required_error: 'Vertical code is required.' })
    .trim()
    .min(2, 'Vertical code must be at least 2 characters.')
    .max(50, 'Vertical code must not exceed 50 characters.')
    .transform((val) => val.toUpperCase()),
  vertical_name: z
    .string({ required_error: 'Vertical name is required.' })
    .trim()
    .min(2, 'Vertical name must be at least 2 characters.')
    .max(100, 'Vertical name must not exceed 100 characters.'),
});

export const updateVerticalSchema = z.object({
  vertical_name: z
    .string()
    .trim()
    .min(2, 'Vertical name must be at least 2 characters.')
    .max(100, 'Vertical name must not exceed 100 characters.')
    .optional(),
  is_active: z.boolean().optional(),
});

export const createSBUSchema = z.object({
  sbu_code: z
    .string({ required_error: 'SBU code is required.' })
    .trim()
    .min(2, 'SBU code must be at least 2 characters.')
    .max(50, 'SBU code must not exceed 50 characters.')
    .transform((val) => val.toUpperCase()),
  sbu_name: z
    .string({ required_error: 'SBU name is required.' })
    .trim()
    .min(2, 'SBU name must be at least 2 characters.')
    .max(100, 'SBU name must not exceed 100 characters.'),
  vertical_id: z.coerce
    .number({ required_error: 'Parent Vertical ID is required.' })
    .int()
    .positive('Invalid Vertical ID.'),
});

export const updateSBUSchema = z.object({
  sbu_name: z
    .string()
    .trim()
    .min(2, 'SBU name must be at least 2 characters.')
    .max(100, 'SBU name must not exceed 100 characters.')
    .optional(),
  vertical_id: z.coerce.number().int().positive().optional(),
  is_active: z.boolean().optional(),
});

export const createClientSchema = z.object({
  client_name: z
    .string({ required_error: 'Client name is required.' })
    .trim()
    .min(2, 'Client name must be at least 2 characters.')
    .max(150, 'Client name must not exceed 150 characters.'),
  client_type: z.enum(['DOMESTIC', 'INTERNATIONAL'], {
    errorMap: () => ({ message: "Client type must be either 'DOMESTIC' or 'INTERNATIONAL'." }),
  }),
});

export const updateClientSchema = z.object({
  client_name: z
    .string()
    .trim()
    .min(2, 'Client name must be at least 2 characters.')
    .max(150, 'Client name must not exceed 150 characters.')
    .optional(),
  client_type: z
    .enum(['DOMESTIC', 'INTERNATIONAL'], {
      errorMap: () => ({ message: "Client type must be either 'DOMESTIC' or 'INTERNATIONAL'." }),
    })
    .optional(),
  is_active: z.boolean().optional(),
});

export const createLocationSchema = z.object({
  state: z
    .string({ required_error: 'State is required.' })
    .trim()
    .min(2, 'State must be at least 2 characters.')
    .max(100, 'State must not exceed 100 characters.'),
  city: z
    .string({ required_error: 'City is required.' })
    .trim()
    .min(2, 'City must be at least 2 characters.')
    .max(100, 'City must not exceed 100 characters.'),
  facility_name: z
    .string({ required_error: 'Facility name is required.' })
    .trim()
    .min(2, 'Facility name must be at least 2 characters.')
    .max(150, 'Facility name must not exceed 150 characters.'),
});

export const updateLocationSchema = z.object({
  state: z
    .string()
    .trim()
    .min(2, 'State must be at least 2 characters.')
    .max(100, 'State must not exceed 100 characters.')
    .optional(),
  city: z
    .string()
    .trim()
    .min(2, 'City must be at least 2 characters.')
    .max(100, 'City must not exceed 100 characters.')
    .optional(),
  facility_name: z
    .string()
    .trim()
    .min(2, 'Facility name must be at least 2 characters.')
    .max(150, 'Facility name must not exceed 150 characters.')
    .optional(),
});
