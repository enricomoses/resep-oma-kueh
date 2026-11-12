import { z } from 'zod';
import {
  CART_CONFLICTS,
  CART_LIMITS,
  CART_STORAGE,
} from '@/constants/cart.constant';
import { CATALOG_AVAILABILITY } from '@/constants/catalog.constant';
import {
  bundleBreakdownItemSchema,
  plainTextLabelSchema,
  slugSchema,
} from './catalog.schema';

export function createCartLineSignature(
  branchId: string,
  variantId: string,
  choiceIds: readonly string[],
): string {
  const sortedChoices = [...choiceIds].sort().join(',');
  return `${branchId}:${variantId}:${sortedChoices}`;
}

export const cartPersistedLineSchema = z
  .object({
    id: z.string().min(1),
    branchId: z.string().uuid(),
    variantId: z.string().uuid(),
    choiceIds: z.array(z.string().uuid()).max(CART_LIMITS.MAX_OPTIONS_PER_LINE),
    quantity: z.number().int().min(1).max(CART_LIMITS.MAX_QTY_PER_LINE),
    addedAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export const cartPersistedStateSchema = z
  .object({
    version: z.literal(CART_STORAGE.VERSION),
    branchId: z.string().uuid().nullable(),
    branchCode: z.string().max(CART_LIMITS.MAX_STORAGE_KEY_LENGTH).nullable(),
    lines: z.array(cartPersistedLineSchema).max(CART_LIMITS.MAX_DISTINCT_LINES),
  })
  .strict();

const cartValidationItemRequestSchema = z
  .object({
    lineId: z.string().min(1),
    variantId: z.string().uuid(),
    choiceIds: z.array(z.string().uuid()).max(CART_LIMITS.MAX_OPTIONS_PER_LINE),
    quantity: z.number().int().min(1).max(CART_LIMITS.MAX_QTY_PER_LINE),
  })
  .strict();

export const cartValidationRequestSchema = z
  .object({
    branchId: z.string().uuid(),
    items: z
      .array(cartValidationItemRequestSchema)
      .max(CART_LIMITS.MAX_DISTINCT_LINES),
  })
  .strict();

export const cartConflictTypeSchema = z.enum([
  CART_CONFLICTS.NONE,
  CART_CONFLICTS.SOLD_OUT,
  CART_CONFLICTS.NOT_OFFERED,
  CART_CONFLICTS.PRICE_CHANGED,
  CART_CONFLICTS.COMPONENT_UNAVAILABLE,
  CART_CONFLICTS.ARCHIVED,
]);

export const cartValidatedLineSchema = z
  .object({
    lineId: z.string().min(1),
    variantId: z.string().uuid(),
    productId: z.string().uuid(),
    productName: plainTextLabelSchema,
    productSlug: slugSchema,
    productType: z.enum(['simple', 'variants', 'bundle']),
    variantName: plainTextLabelSchema,
    sku: z.string().trim().min(1).max(120),
    sizeLabel: plainTextLabelSchema.nullable(),
    imageAlt: plainTextLabelSchema,
    quantity: z.number().int().min(1).max(CART_LIMITS.MAX_QTY_PER_LINE),
    unitGrossIdr: z.number().int().nonnegative(),
    unconditionalDiscountIdr: z.number().int().nonnegative(),
    effectiveUnitPriceIdr: z.number().int().nonnegative(),
    subtotalIdr: z.number().int().nonnegative(),
    availabilityStatus: z.enum(CATALOG_AVAILABILITY).or(z.literal('archived')),
    conflict: cartConflictTypeSchema,
    conflictMessage: z.string().nullable(),
    bundleBreakdown: z.array(bundleBreakdownItemSchema),
    choiceNames: z.array(plainTextLabelSchema),
  })
  .strict();

export const cartValidationResponseSchema = z
  .object({
    branchId: z.string().uuid(),
    branchName: plainTextLabelSchema,
    lines: z.array(cartValidatedLineSchema),
    estimatedSubtotalIdr: z.number().int().nonnegative(),
    totalDiscountIdr: z.number().int().nonnegative(),
    estimatedTotalIdr: z.number().int().nonnegative(),
    hasBlockingConflicts: z.boolean(),
    hasPriceChanges: z.boolean(),
  })
  .strict();
