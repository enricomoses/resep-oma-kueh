import { z } from 'zod';
import {
  CATALOG_AVAILABILITY,
  CATALOG_LIMITS,
  CATALOG_SORTS,
} from '@/constants/catalog.constant';
import { BRANCH } from '@/constants/site.constant';

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const plainTextLabelSchema = z.string().trim().min(1).max(200);

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
