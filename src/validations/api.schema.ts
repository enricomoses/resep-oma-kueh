import { z } from 'zod';

import { API_ERROR_CODES } from '@/constants/copy.constant';
import { LIMITS } from '@/constants/validation.constant';

const requestIdSchema = z.string().trim().min(1).max(LIMITS.REQUEST_ID_LENGTH);
const metaSchema = z.strictObject({
  page: z.int().positive().optional(),
  limit: z.int().min(1).max(LIMITS.PAGE_SIZE).optional(),
  total: z.int().nonnegative().optional(),
});

export function apiSuccessSchema<T>(dataSchema: z.ZodType<T>) {
  return z.strictObject({
    ok: z.literal(true),
    data: dataSchema,
    requestId: requestIdSchema,
    meta: metaSchema.optional(),
  });
}

export const apiErrorSchema = z.strictObject({
  ok: z.literal(false),
  error: z.strictObject({
    code: z.enum(API_ERROR_CODES),
    message: z.string().min(1).max(LIMITS.ERROR_MESSAGE_LENGTH),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  }),
  requestId: requestIdSchema,
});
