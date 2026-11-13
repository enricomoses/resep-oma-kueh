import { z } from 'zod';

export const healthStatusSchema = z.strictObject({
  status: z.literal('ok'),
  checks: z.strictObject({
    database: z.literal('ok'),
  }),
});
