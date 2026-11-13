import { z } from 'zod';
import {
  CHECKOUT_COPY,
  CHECKOUT_LIMITS,
  FULFILLMENT_METHODS,
} from '@/constants/checkout.constant';
import { isValidJakartaDate } from '@/utils/checkout';
import {
  bundleBreakdownItemSchema,
  plainTextLabelSchema,
} from './catalog.schema';

export const checkoutItemInputSchema = z
  .object({
    variantId: z.string().uuid(),
    quantity: z.number().int().min(1).max(CHECKOUT_LIMITS.MAX_QTY_PER_LINE),
    choiceIds: z
      .array(z.string().uuid())
      .max(CHECKOUT_LIMITS.MAX_OPTIONS_PER_LINE)
      .default([]),
  })
  .strict();

export const checkoutFulfillmentInputSchema = z
  .object({
    method: z.enum(FULFILLMENT_METHODS),
    requestedDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, CHECKOUT_COPY.ERROR_INVALID_DATE),
    requestedTimeWindow: z
      .string()
      .trim()
      .max(CHECKOUT_LIMITS.MAX_TIME_WINDOW_LENGTH)
      .nullable()
      .optional(),
    address: z
      .string()
      .trim()
      .max(CHECKOUT_LIMITS.MAX_ADDRESS_LENGTH)
      .nullable()
      .optional(),
    note: z
      .string()
      .trim()
      .max(CHECKOUT_LIMITS.MAX_NOTE_LENGTH)
      .nullable()
      .optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (!isValidJakartaDate(val.requestedDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['requestedDate'],
        message: CHECKOUT_COPY.ERROR_INVALID_DATE,
      });
    }

    if (val.method === 'delivery') {
      const cleanAddress = val.address?.trim() ?? '';
      if (cleanAddress.length < CHECKOUT_LIMITS.MIN_ADDRESS_LENGTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['address'],
          message: CHECKOUT_COPY.ERROR_DELIVERY_ADDRESS_REQUIRED,
        });
      }
    }
  });

export const checkoutPrepareRequestSchema = z
  .object({
    branchId: z.string().uuid(),
    items: z
      .array(checkoutItemInputSchema)
      .min(1, CHECKOUT_COPY.ERROR_EMPTY_ITEMS)
      .max(CHECKOUT_LIMITS.MAX_DISTINCT_LINES),
    fulfillment: checkoutFulfillmentInputSchema,
    customerName: z
      .string()
      .trim()
      .min(
        CHECKOUT_LIMITS.MIN_CUSTOMER_NAME_LENGTH,
        CHECKOUT_COPY.ERROR_CUSTOMER_NAME_REQUIRED,
      )
      .max(
        CHECKOUT_LIMITS.MAX_CUSTOMER_NAME_LENGTH,
        CHECKOUT_COPY.ERROR_CUSTOMER_NAME_REQUIRED,
      ),
    acknowledgedManualConfirmation: z.literal(
      true,
      CHECKOUT_COPY.ERROR_MANUAL_CONFIRMATION_REQUIRED,
    ),
    expectedQuoteFingerprint: z
      .string()
      .regex(/^[0-9a-f]{64}$/i)
      .nullable()
      .optional(),
  })
  .strict();

export const checkoutFormSchema = z
  .object({
    customerName: z
      .string()
      .trim()
      .min(
        CHECKOUT_LIMITS.MIN_CUSTOMER_NAME_LENGTH,
        CHECKOUT_COPY.ERROR_CUSTOMER_NAME_REQUIRED,
      )
      .max(
        CHECKOUT_LIMITS.MAX_CUSTOMER_NAME_LENGTH,
        CHECKOUT_COPY.ERROR_CUSTOMER_NAME_REQUIRED,
      ),
    method: z.enum(FULFILLMENT_METHODS),
    requestedDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, CHECKOUT_COPY.ERROR_INVALID_DATE),
    requestedTimeWindow: z
      .string()
      .trim()
      .max(CHECKOUT_LIMITS.MAX_TIME_WINDOW_LENGTH)
      .optional(),
    address: z
      .string()
      .trim()
      .max(CHECKOUT_LIMITS.MAX_ADDRESS_LENGTH)
      .optional(),
    note: z.string().trim().max(CHECKOUT_LIMITS.MAX_NOTE_LENGTH).optional(),
    acknowledgedManualConfirmation: z
      .boolean()
      .refine(
        (val) => val === true,
        CHECKOUT_COPY.ERROR_MANUAL_CONFIRMATION_REQUIRED,
      ),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (!isValidJakartaDate(val.requestedDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['requestedDate'],
        message: CHECKOUT_COPY.ERROR_INVALID_DATE,
      });
    }

    if (val.method === 'delivery') {
      const cleanAddress = val.address?.trim() ?? '';
      if (cleanAddress.length < CHECKOUT_LIMITS.MIN_ADDRESS_LENGTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['address'],
          message: CHECKOUT_COPY.ERROR_DELIVERY_ADDRESS_REQUIRED,
        });
      }
    }
  });

export const checkoutPrepareLineSchema = z
  .object({
    variantId: z.string().uuid(),
    productName: plainTextLabelSchema,
    variantName: plainTextLabelSchema,
    sku: z.string().trim().min(1).max(120),
    sizeLabel: plainTextLabelSchema.nullable(),
    quantity: z.number().int().positive(),
    unitGrossIdr: z.number().int().nonnegative(),
    unitPriceIdr: z.number().int().nonnegative(),
    discountIdr: z.number().int().nonnegative(),
    lineTotalIdr: z.number().int().nonnegative(),
    options: z.array(
      z
        .object({
          choiceId: z.string().uuid(),
          label: plainTextLabelSchema,
          priceDeltaIdr: z.number().int().nonnegative(),
        })
        .strict(),
    ),
    bundleBreakdown: z.array(bundleBreakdownItemSchema).optional(),
  })
  .strict();

export const checkoutWarningSchema = z
  .object({
    code: z.string(),
    message: z.string(),
  })
  .strict();

export const checkoutPrepareResponseSchema = z
  .object({
    branch: z
      .object({
        id: z.string().uuid(),
        name: plainTextLabelSchema,
        whatsappNumber: z.string().min(5).max(30),
      })
      .strict(),
    lines: z.array(checkoutPrepareLineSchema),
    subtotalIdr: z.number().int().nonnegative(),
    discountIdr: z.number().int().nonnegative(),
    estimatedTotalIdr: z.number().int().nonnegative(),
    shippingFee: z.literal('to_be_confirmed'),
    warnings: z.array(checkoutWarningSchema),
    quoteFingerprint: z.string().regex(/^[0-9a-f]{64}$/),
    quotedAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    requiresReview: z.boolean(),
    requiresCopy: z.boolean(),
    whatsappUrl: z.string().url(),
    messagePreview: z.string().min(1),
  })
  .strict();
