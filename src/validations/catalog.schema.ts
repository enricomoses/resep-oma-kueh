import { z } from 'zod';
import {
  CATALOG_AVAILABILITY,
  CATALOG_LIMITS,
  CATALOG_SORTS,
} from '@/constants/catalog.constant';
import { BRANCH } from '@/constants/site.constant';

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const plainTextLabelSchema = z.string().trim().min(1).max(200);

const optionalPositiveIntString = z
  .union([
    z.number().int(),
    z
      .string()
      .trim()
      .regex(/^\d+$/)
      .transform((val) => Number(val)),
  ])
  .optional();

export const catalogQuerySchema = z
  .object({
    branch: z
      .string()
      .trim()
      .min(1)
      .max(BRANCH.MAX_CODE_LENGTH)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    category: slugSchema.optional(),
    q: z
      .string()
      .trim()
      .min(1)
      .max(CATALOG_LIMITS.MAX_SEARCH_LENGTH)
      .optional(),
    tag: slugSchema.optional(),
    availability: z.enum(CATALOG_AVAILABILITY).optional(),
    minPriceIdr: optionalPositiveIntString.refine(
      (val) =>
        val === undefined ||
        (Number.isSafeInteger(val) &&
          val >= 0 &&
          val <= CATALOG_LIMITS.MAX_UNIT_IDR),
      { message: 'Invalid minPriceIdr' },
    ),
    maxPriceIdr: optionalPositiveIntString.refine(
      (val) =>
        val === undefined ||
        (Number.isSafeInteger(val) &&
          val >= 0 &&
          val <= CATALOG_LIMITS.MAX_UNIT_IDR),
      { message: 'Invalid maxPriceIdr' },
    ),
    sort: z.enum(CATALOG_SORTS).default('featured'),
    page: optionalPositiveIntString
      .default(CATALOG_LIMITS.DEFAULT_PAGE)
      .refine((val) => Number.isSafeInteger(val) && val >= 1 && val <= 10_000, {
        message: 'Invalid page',
      }),
    limit: optionalPositiveIntString
      .default(CATALOG_LIMITS.DEFAULT_LIMIT)
      .refine(
        (val) =>
          Number.isSafeInteger(val) &&
          val >= 1 &&
          val <= CATALOG_LIMITS.MAX_LIMIT,
        { message: 'Invalid limit' },
      ),
  })
  .strict()
  .refine(
    (data) =>
      data.minPriceIdr === undefined ||
      data.maxPriceIdr === undefined ||
      data.minPriceIdr <= data.maxPriceIdr,
    { message: 'minPriceIdr cannot exceed maxPriceIdr' },
  );

export const publicCategorySchema = z
  .object({
    id: z.uuid(),
    name: plainTextLabelSchema,
    slug: slugSchema,
    description: z.string().max(1000).nullable(),
    sortOrder: z.number().int(),
  })
  .strict();

export const publicCategoryDirectorySchema = z
  .object({
    items: z
      .array(publicCategorySchema)
      .max(CATALOG_LIMITS.MAX_CATEGORIES_READ),
  })
  .strict();

export const catalogDietaryTagSchema = z
  .object({
    slug: slugSchema,
    name: plainTextLabelSchema,
  })
  .strict();

const catalogPromotionBadgeSchema = z
  .object({
    id: z.uuid(),
    title: plainTextLabelSchema,
    slug: slugSchema,
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().positive(),
    minSpendIdr: z.number().int().nonnegative(),
    maxDiscountIdr: z.number().int().nonnegative().nullable(),
  })
  .strict();

export const catalogProductItemSchema = z
  .object({
    id: z.uuid(),
    name: plainTextLabelSchema,
    slug: slugSchema,
    shortDescription: z.string().max(500).nullable(),
    description: z.string().max(2000).nullable(),
    productType: z.enum(['simple', 'variants', 'bundle']),
    isFeatured: z.boolean(),
    isBestSeller: z.boolean(),
    isNew: z.boolean(),
    sortOrder: z.number().int(),
    createdAt: z.string().min(1),
    primaryCategory: z
      .object({
        id: z.uuid(),
        name: plainTextLabelSchema,
        slug: slugSchema,
      })
      .strict()
      .nullable(),
    imageAlt: plainTextLabelSchema,
    previewImageUrl: z.url().max(2000).nullable().optional(),
    verifiedDietaryTags: z.array(catalogDietaryTagSchema).max(16),
    activeVariantCount: z.number().int().nonnegative(),
    offeredVariantCount: z.number().int().nonnegative(),
    availabilityStatus: z.enum(CATALOG_AVAILABILITY).nullable(),
    baseFromPriceIdr: z.number().int().nonnegative().nullable(),
    fromPriceIdr: z.number().int().nonnegative().nullable(),
    appliedPromotion: catalogPromotionBadgeSchema.nullable(),
    conditionalPromotion: catalogPromotionBadgeSchema.nullable(),
  })
  .strict();

const catalogAppliedFiltersSchema = z
  .object({
    branch: slugSchema.nullable(),
    category: slugSchema.nullable(),
    q: z.string().max(CATALOG_LIMITS.MAX_SEARCH_LENGTH).nullable(),
    tag: slugSchema.nullable(),
    availability: z.enum(CATALOG_AVAILABILITY).nullable(),
    minPriceIdr: z.number().int().nonnegative().nullable(),
    maxPriceIdr: z.number().int().nonnegative().nullable(),
    sort: z.enum(CATALOG_SORTS),
  })
  .strict();

export const catalogDirectorySchema = z
  .object({
    items: z.array(catalogProductItemSchema).max(CATALOG_LIMITS.MAX_LIMIT),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().min(1).max(CATALOG_LIMITS.MAX_LIMIT),
    totalPages: z.number().int().nonnegative(),
    resolvedBranchId: z.uuid().nullable(),
    appliedFilters: catalogAppliedFiltersSchema,
  })
  .strict();

export const productDetailQuerySchema = z
  .object({
    slug: slugSchema,
    branch: z
      .string()
      .trim()
      .min(1)
      .max(BRANCH.MAX_CODE_LENGTH)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
  })
  .strict();

export const productDetailImageSchema = z
  .object({
    id: z.uuid(),
    variantId: z.uuid().nullable(),
    altText: plainTextLabelSchema,
    isPrimary: z.boolean(),
    sortOrder: z.number().int(),
    publicUrl: z.string().url().nullable(),
  })
  .strict();

export const productDetailAllergenSchema = z
  .object({
    slug: slugSchema,
    name: plainTextLabelSchema,
    presence: z.enum(['contains', 'may_contain', 'not_declared']),
  })
  .strict();

export const productDetailComponentVariantSummarySchema = z
  .object({
    id: z.uuid(),
    sku: z.string().trim().min(1).max(120),
    name: plainTextLabelSchema,
    productId: z.uuid().nullable().optional(),
    availabilityStatus: z.enum(CATALOG_AVAILABILITY).optional(),
    stockQuantity: z.number().int().nonnegative().nullable().optional(),
    isOfferedInBranch: z.boolean().optional(),
    verifiedDietaryTags: z.array(catalogDietaryTagSchema).optional(),
  })
  .strict();

export const productDetailOptionChoiceSchema = z
  .object({
    id: z.uuid(),
    groupId: z.uuid().optional(),
    label: plainTextLabelSchema,
    priceDeltaIdr: z.number().int().nonnegative(),
    componentVariantId: z.uuid().nullable(),
    isActive: z.boolean().optional().default(true),
    sortOrder: z.number().int(),
    componentVariant: productDetailComponentVariantSummarySchema
      .nullable()
      .optional(),
  })
  .strict();

export const productDetailOptionGroupSchema = z
  .object({
    id: z.uuid(),
    name: plainTextLabelSchema,
    minSelect: z.number().int().nonnegative(),
    maxSelect: z.number().int().nonnegative(),
    quantityPerSelection: z.number().int().positive(),
    isRequired: z.boolean(),
    sortOrder: z.number().int(),
    choices: z.array(productDetailOptionChoiceSchema).max(32),
  })
  .strict();

export const productDetailFixedComponentSchema = z
  .object({
    id: z.uuid(),
    componentSlot: plainTextLabelSchema,
    componentVariantId: z.uuid(),
    quantity: z.number().int().positive(),
    sortOrder: z.number().int(),
    componentVariant: productDetailComponentVariantSummarySchema
      .nullable()
      .optional(),
  })
  .strict();

export const productDetailVariantSchema = z
  .object({
    id: z.uuid(),
    sku: z.string().trim().min(1).max(120),
    name: plainTextLabelSchema,
    sizeLabel: plainTextLabelSchema.nullable(),
    isDefault: z.boolean(),
    sortOrder: z.number().int(),
    maxQuantityPerOrder: z
      .number()
      .int()
      .min(1)
      .max(CATALOG_LIMITS.MAX_QUANTITY_PER_LINE),
    bundleRecipe: z.string().max(120).nullable(),
    bundleUnitsTotal: z.number().int().positive().nullable(),
    bundleRulesVerified: z.boolean(),
    availabilityStatus: z.enum(CATALOG_AVAILABILITY),
    stockQuantity: z.number().int().nonnegative().nullable(),
    baseOrOverrideIdr: z.number().int().nonnegative(),
    minOptionDeltaIdr: z.number().int().nonnegative(),
    unitGrossIdr: z.number().int().nonnegative(),
    unconditionalDiscountIdr: z.number().int().nonnegative(),
    effectivePriceIdr: z.number().int().nonnegative(),
    appliedPromotion: catalogPromotionBadgeSchema.nullable(),
    conditionalPromotion: catalogPromotionBadgeSchema.nullable(),
    verifiedDietaryTags: z.array(catalogDietaryTagSchema).max(16),
    verifiedAllergens: z.array(productDetailAllergenSchema).max(32),
    optionGroups: z.array(productDetailOptionGroupSchema).max(16),
    fixedComponents: z.array(productDetailFixedComponentSchema).max(16),
  })
  .strict();

export const productDetailSchema = z
  .object({
    id: z.uuid(),
    name: plainTextLabelSchema,
    slug: slugSchema,
    shortDescription: z.string().max(500).nullable(),
    description: z.string().max(2000).nullable(),
    ingredientsInfo: z.string().max(2000).nullable(),
    storageInstructions: z.string().max(2000).nullable(),
    productType: z.enum(['simple', 'variants', 'bundle']),
    isFeatured: z.boolean(),
    isBestSeller: z.boolean(),
    isNew: z.boolean(),
    primaryCategory: z
      .object({
        id: z.uuid(),
        name: plainTextLabelSchema,
        slug: slugSchema,
      })
      .strict(),
    categories: z
      .array(
        z
          .object({
            id: z.uuid(),
            name: plainTextLabelSchema,
            slug: slugSchema,
            isPrimary: z.boolean(),
          })
          .strict(),
      )
      .max(16),
    images: z.array(productDetailImageSchema).max(24),
    resolvedBranchId: z.uuid().nullable(),
    resolvedBranchCode: slugSchema.nullable(),
    activeVariantCount: z.number().int().positive(),
    offeredVariants: z.array(productDetailVariantSchema).max(32),
    relatedProducts: z
      .array(catalogProductItemSchema)
      .max(CATALOG_LIMITS.MAX_RELATED_PRODUCTS),
  })
  .strict();

export const bundleBreakdownItemSchema = z
  .object({
    slotOrGroup: z.string().min(1).max(100),
    label: z.string().min(1).max(200),
    quantity: z.number().int().positive(),
    priceDeltaIdr: z.number().int().nonnegative(),
    componentVariantId: z.uuid().nullable(),
    isFixed: z.boolean(),
  })
  .strict();

export const preparedCartLinePayloadSchema = z
  .object({
    branchId: z.uuid(),
    branchCode: slugSchema,
    productId: z.uuid(),
    productSlug: slugSchema,
    productName: plainTextLabelSchema,
    productType: z.enum(['simple', 'variants', 'bundle']),
    variantId: z.uuid(),
    sku: z.string().trim().min(1).max(120),
    variantName: plainTextLabelSchema,
    sizeLabel: plainTextLabelSchema.nullable(),
    quantity: z.number().int().min(1).max(CATALOG_LIMITS.MAX_QUANTITY_PER_LINE),
    choiceIds: z.array(z.uuid()).max(12),
    bundleSignature: z.string().max(256).nullable().optional(),
    bundleBreakdown: z.array(bundleBreakdownItemSchema).optional(),
    estimatedUnitPriceIdr: z.number().int().nonnegative(),
    estimatedSubtotalIdr: z.number().int().nonnegative(),
  })
  .strict();
