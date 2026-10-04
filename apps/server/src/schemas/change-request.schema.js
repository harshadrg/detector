import { z } from 'zod';

export const submitChangeRequestSchema = z.object({
  change_type: z.enum(['PROCESS_UPDATE', 'PROCESS_DEACTIVATION']),
  proposed_data: z.record(z.any()),
  action: z.enum(['DRAFT', 'SUBMIT']),
  reason: z.string().trim().max(500).nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.change_type === 'PROCESS_DEACTIVATION') {
    if (!data.proposed_data.ended_on || !data.proposed_data.closure_remarks) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ended_on and closure_remarks are required in proposed_data for PROCESS_DEACTIVATION.',
        path: ['proposed_data'],
      });
    }
  }
});
