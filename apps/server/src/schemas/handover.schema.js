import { z } from 'zod';

export const requestHandoverSchema = z.object({
  from_pm_ecode: z.string().trim().max(20).nullable().optional(),
  to_pm_ecode: z.string({ required_error: 'to_pm_ecode is required.' }).trim().min(1).max(20),
  scenario: z.string({ required_error: 'scenario is required.' }).trim().min(1).max(50),
  effective_date: z.string({ required_error: 'effective_date is required.' }).datetime().or(z.date()),
  reason: z.string({ required_error: 'reason is required.' }).trim().min(1).max(500),
});

export const reviewHandoverSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT'], { required_error: 'action must be APPROVE or REJECT.' }),
  review_remarks: z.string().trim().max(500).nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.action === 'REJECT') {
    if (!data.review_remarks || data.review_remarks.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Review remarks are required when rejecting a handover.',
        path: ['review_remarks'],
      });
    }
  }
});
