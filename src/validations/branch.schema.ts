import { z } from 'zod';
import { BRANCH } from '@/constants/site.constant';

const branchCodeSchema = z
  .string()
  .max(BRANCH.MAX_CODE_LENGTH)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const branchQuerySchema = z
  .object({ branch: branchCodeSchema.optional() })
  .strict();
export const publicBranchSchema = z
  .object({
    id: z.uuid(),
    code: branchCodeSchema,
    name: z.string().min(1).max(120),
    city: z.string().min(1).max(120),
    whatsappNumber: z.string().regex(/^[1-9][0-9]{7,14}$/),
    address: z.string().max(500).nullable(),
    mapsUrl: z.url().startsWith('https://').nullable(),
    allowPickup: z.boolean().optional(),
    allowDelivery: z.boolean().optional(),
  })
  .strict();
export const branchDirectorySchema = z
  .object({
    items: z.array(publicBranchSchema).max(BRANCH.MAX_RECORDS),
    resolvedBranchId: z.uuid().nullable(),
  })
  .strict()
  .refine(
    (data) =>
      data.resolvedBranchId === null ||
      data.items.some((branch) => branch.id === data.resolvedBranchId),
  );
export const branchPreferenceSchema = z
  .object({ selectedBranchId: z.uuid().nullable() })
  .strict();
