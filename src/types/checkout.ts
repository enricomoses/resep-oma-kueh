import type { z } from 'zod';
import type {
  checkoutFormSchema,
  checkoutFulfillmentInputSchema,
  checkoutItemInputSchema,
  checkoutPrepareLineSchema,
  checkoutPrepareRequestSchema,
  checkoutPrepareResponseSchema,
  checkoutWarningSchema,
} from '@/validations/checkout.schema';

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
export type CheckoutItemInput = z.infer<typeof checkoutItemInputSchema>;
export type CheckoutFulfillmentInput = z.infer<
  typeof checkoutFulfillmentInputSchema
>;
export type CheckoutPrepareRequest = z.infer<
  typeof checkoutPrepareRequestSchema
>;
export type CheckoutPrepareLine = z.infer<typeof checkoutPrepareLineSchema>;
export type CheckoutWarning = z.infer<typeof checkoutWarningSchema>;
export type CheckoutPrepareResponse = z.infer<
  typeof checkoutPrepareResponseSchema
>;
