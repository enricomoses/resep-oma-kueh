import { z } from 'zod';

import {
  ADMIN_CATALOG_LIMITS,
  ADMIN_CATALOG_STATUSES,
  ADMIN_PRODUCT_TYPES,
} from '@/constants/admin-catalog.constant';
import { adminRoleSchema } from '@/validations/auth.schema';

export const adminCatalogStatusSchema = z.enum(ADMIN_CATALOG_STATUSES);
export const adminProductTypeSchema = z.enum(ADMIN_PRODUCT_TYPES);

const slugSchema = z
  .string()
  .trim()
  .min(ADMIN_CATALOG_LIMITS.SLUG_MIN)
  .max(ADMIN_CATALOG_LIMITS.SLUG_MAX)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug hanya boleh huruf kecil, angka, dan tanda hubung.',
  });

const nullableTrimmedText = (maxLen: number) =>
  z
    .string()
    .trim()
    .max(maxLen)
    .transform((val) => (val.length === 0 ? null : val))
    .nullable();

const isoTimestampSchema = z.string().trim().min(1).max(64);

const adminOverviewOwnerCountsSchema = z.strictObject({
  categoriesPublished: z.int().nonnegative(),
  categoriesDraft: z.int().nonnegative(),
  categoriesArchived: z.int().nonnegative(),
  productsPublished: z.int().nonnegative(),
  productsDraft: z.int().nonnegative(),
  productsArchived: z.int().nonnegative(),
  productsNeedsReview: z.int().nonnegative(),
  activeBranches: z.int().nonnegative(),
  soldOutOffers: z.int().nonnegative(),
  activePromotions: z.int().nonnegative(),
  upcomingSessions: z.int().nonnegative(),
});

const adminOverviewStaffCountsSchema = z.strictObject({
  availableOffers: z.int().nonnegative(),
  soldOutOffers: z.int().nonnegative(),
  upcomingSessions: z.int().nonnegative(),
});

export const adminOverviewResponseSchema = z.strictObject({
  role: adminRoleSchema,
  branchId: z.uuid().nullable(),
  branchName: z.string().nullable(),
  ownerCounts: adminOverviewOwnerCountsSchema.nullable(),
  staffCounts: adminOverviewStaffCountsSchema.nullable(),
});

export const adminCategoryItemSchema = z.strictObject({
  id: z.uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  parentId: z.uuid().nullable(),
  parentName: z.string().nullable(),
  description: z.string().nullable(),
  sortOrder: z.int().min(ADMIN_CATALOG_LIMITS.SORT_ORDER_MIN),
  status: adminCatalogStatusSchema,
  childCount: z.int().nonnegative(),
  productRefCount: z.int().nonnegative(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

export const adminCategoryListResponseSchema = z.strictObject({
  items: z.array(adminCategoryItemSchema),
});

export const adminCategoryDetailResponseSchema = z.strictObject({
  category: adminCategoryItemSchema,
});

export const createAdminCategorySchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(ADMIN_CATALOG_LIMITS.NAME_MIN, {
      message: 'Nama kategori minimal 2 karakter.',
    })
    .max(ADMIN_CATALOG_LIMITS.NAME_MAX),
  slug: slugSchema,
  parentId: z.uuid().nullable(),
  description: nullableTrimmedText(ADMIN_CATALOG_LIMITS.SHORT_DESC_MAX),
  sortOrder: z
    .int()
    .min(ADMIN_CATALOG_LIMITS.SORT_ORDER_MIN)
    .max(ADMIN_CATALOG_LIMITS.SORT_ORDER_MAX),
  status: z.enum(['draft', 'published']),
});

export const updateAdminCategorySchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(ADMIN_CATALOG_LIMITS.NAME_MIN, {
      message: 'Nama kategori minimal 2 karakter.',
    })
    .max(ADMIN_CATALOG_LIMITS.NAME_MAX),
  parentId: z.uuid().nullable(),
  description: nullableTrimmedText(ADMIN_CATALOG_LIMITS.SHORT_DESC_MAX),
  sortOrder: z
    .int()
    .min(ADMIN_CATALOG_LIMITS.SORT_ORDER_MIN)
    .max(ADMIN_CATALOG_LIMITS.SORT_ORDER_MAX),
  status: adminCatalogStatusSchema,
  expectedUpdatedAt: isoTimestampSchema,
});

export const archiveAdminEntitySchema = z.strictObject({
  expectedUpdatedAt: isoTimestampSchema,
});

const adminProductCategoryRefSchema = z.strictObject({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  status: adminCatalogStatusSchema,
  isPrimary: z.boolean(),
});

const adminProductReadinessSchema = z.strictObject({
  hasPublishedCategory: z.boolean(),
  activeVariantCount: z.int().nonnegative(),
  hasActiveBranchOffer: z.boolean(),
  approvedImageCount: z.int().nonnegative(),
  needsOwnerReview: z.boolean(),
  isPublishReady: z.boolean(),
  missingReasons: z.array(z.string()),
});

export const adminProductItemSchema = z.strictObject({
  id: z.uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  productType: adminProductTypeSchema,
  status: adminCatalogStatusSchema,
  needsOwnerReview: z.boolean(),
  isFeatured: z.boolean(),
  isBestSeller: z.boolean(),
  isNew: z.boolean(),
  shortDescription: z.string().nullable(),
  description: z.string().nullable(),
  ingredientsInfo: z.string().nullable(),
  storageInstructions: z.string().nullable(),
  sortOrder: z.int().min(ADMIN_CATALOG_LIMITS.SORT_ORDER_MIN),
  categories: z.array(adminProductCategoryRefSchema),
  readiness: adminProductReadinessSchema,
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

export const adminProductQuerySchema = z.strictObject({
  q: z.string().trim().max(ADMIN_CATALOG_LIMITS.MAX_SEARCH_LENGTH).optional(),
  status: adminCatalogStatusSchema.optional(),
  categoryId: z.uuid().optional(),
  page: z.coerce
    .number()
    .int()
    .min(1)
    .max(10_000)
    .default(ADMIN_CATALOG_LIMITS.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(ADMIN_CATALOG_LIMITS.MAX_LIMIT)
    .default(ADMIN_CATALOG_LIMITS.DEFAULT_LIMIT),
});

export const adminProductListResponseSchema = z.strictObject({
  items: z.array(adminProductItemSchema),
  total: z.int().nonnegative(),
  page: z.int().positive(),
  limit: z.int().min(1).max(ADMIN_CATALOG_LIMITS.MAX_LIMIT),
  totalPages: z.int().positive(),
});

export const adminProductDetailResponseSchema = z.strictObject({
  product: adminProductItemSchema,
});

export const createAdminProductSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(ADMIN_CATALOG_LIMITS.NAME_MIN, {
      message: 'Nama produk minimal 2 karakter.',
    })
    .max(ADMIN_CATALOG_LIMITS.NAME_MAX),
  slug: slugSchema,
  productType: adminProductTypeSchema,
  shortDescription: nullableTrimmedText(ADMIN_CATALOG_LIMITS.SHORT_DESC_MAX),
  description: nullableTrimmedText(ADMIN_CATALOG_LIMITS.DESC_MAX),
  ingredientsInfo: nullableTrimmedText(ADMIN_CATALOG_LIMITS.NOTES_MAX),
  storageInstructions: nullableTrimmedText(ADMIN_CATALOG_LIMITS.NOTES_MAX),
  isFeatured: z.boolean(),
  isBestSeller: z.boolean(),
  isNew: z.boolean(),
  needsOwnerReview: z.boolean(),
  sortOrder: z
    .int()
    .min(ADMIN_CATALOG_LIMITS.SORT_ORDER_MIN)
    .max(ADMIN_CATALOG_LIMITS.SORT_ORDER_MAX),
});

export const updateAdminProductSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(ADMIN_CATALOG_LIMITS.NAME_MIN, {
      message: 'Nama produk minimal 2 karakter.',
    })
    .max(ADMIN_CATALOG_LIMITS.NAME_MAX),
  productType: adminProductTypeSchema,
  status: adminCatalogStatusSchema,
  shortDescription: nullableTrimmedText(ADMIN_CATALOG_LIMITS.SHORT_DESC_MAX),
  description: nullableTrimmedText(ADMIN_CATALOG_LIMITS.DESC_MAX),
  ingredientsInfo: nullableTrimmedText(ADMIN_CATALOG_LIMITS.NOTES_MAX),
  storageInstructions: nullableTrimmedText(ADMIN_CATALOG_LIMITS.NOTES_MAX),
  isFeatured: z.boolean(),
  isBestSeller: z.boolean(),
  isNew: z.boolean(),
  needsOwnerReview: z.boolean(),
  sortOrder: z
    .int()
    .min(ADMIN_CATALOG_LIMITS.SORT_ORDER_MIN)
    .max(ADMIN_CATALOG_LIMITS.SORT_ORDER_MAX),
  expectedUpdatedAt: isoTimestampSchema,
});
