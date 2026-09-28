import { z } from 'zod';

export const queryNotificationsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  unreadOnly: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (val === true || val === 'true' || val === '1') return true;
      return false;
    }),
});

export const markNotificationReadParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: 'Invalid notification identifier.' }),
});
