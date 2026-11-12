import type { z } from 'zod';
import type {
  cartConflictTypeSchema,
  cartPersistedLineSchema,
  cartValidatedLineSchema,
  cartValidationRequestSchema,
  cartValidationResponseSchema,
} from '@/validations/cart.schema';

export type CartPersistedLine = z.infer<typeof cartPersistedLineSchema>;
export type CartValidationRequest = z.infer<typeof cartValidationRequestSchema>;
export type CartConflictType = z.infer<typeof cartConflictTypeSchema>;
export type CartValidatedLine = z.infer<typeof cartValidatedLineSchema>;
export type CartValidationResponse = z.infer<
  typeof cartValidationResponseSchema
>;
