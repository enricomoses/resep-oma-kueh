import { z } from 'zod';

import {
  ADMIN_ALLERGEN_PRESENCES,
  ADMIN_BUNDLE_SLOTS,
  ADMIN_CATALOG_LIMITS,
  ADMIN_CATALOG_STATUSES,
  ADMIN_DIETARY_VERIFICATION_STATUSES,
  ADMIN_MEDIA_LIMITS,
  ADMIN_PRODUCT_TYPES,
  ADMIN_VARIANT_STATUSES,
} from '@/constants/admin-catalog.constant';
import {
  ADMIN_MEDIA_ALLOWED_MIME_TYPES,
  ADMIN_MEDIA_BUCKETS,
} from '@/utils/admin-media';
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

export const adminVariantStatusSchema = z.enum(ADMIN_VARIANT_STATUSES);
export const adminDietaryVerificationStatusSchema = z.enum(
  ADMIN_DIETARY_VERIFICATION_STATUSES,
);
export const adminAllergenPresenceSchema = z.enum(ADMIN_ALLERGEN_PRESENCES);
const adminBundleSlotSchema = z.enum(ADMIN_BUNDLE_SLOTS);
const adminStorageBucketSchema = z.enum([
  ADMIN_MEDIA_BUCKETS.DRAFTS,
  ADMIN_MEDIA_BUCKETS.PRODUCT_IMAGES,
]);

const skuSchema = z
  .string()
  .trim()
  .min(1, { message: 'Kode SKU wajib diisi.' })
  .max(80)
  .regex(/^[A-Z0-9]+([_-][A-Z0-9]+)*$/, {
    message:
      'SKU harus huruf kapital/angka dengan pemisah strip atau garis bawah (contoh: DEMO-F04-6).',
  });

export const adminConfigCategorySchema = z.strictObject({
  categoryId: z.uuid({ message: 'Kategori tidak valid.' }),
  isPrimary: z.boolean(),
});

export const adminConfigFixedComponentSchema = z.strictObject({
  id: z.uuid(),
  componentVariantId: z.uuid({ message: 'Varian komponen wajib dipilih.' }),
  componentSlot: adminBundleSlotSchema,
  quantity: z.int().min(1).max(99),
  sortOrder: z.int().min(0).max(9999),
});

export const adminConfigOptionChoiceSchema = z.strictObject({
  id: z.uuid(),
  label: z
    .string()
    .trim()
    .min(1, { message: 'Label pilihan wajib diisi.' })
    .max(200),
  componentVariantId: z.uuid({ message: 'Varian komponen wajib dipilih.' }),
  priceDeltaIdr: z.int().min(0).max(ADMIN_CATALOG_LIMITS.MAX_UNIT_PRICE_IDR),
  isActive: z.boolean(),
  sortOrder: z.int().min(0).max(9999),
});

export const adminConfigOptionGroupSchema = z.strictObject({
  id: z.uuid(),
  name: z
    .string()
    .trim()
    .min(1, { message: 'Nama grup pilihan wajib diisi.' })
    .max(200),
  minSelect: z.int().min(0).max(99),
  maxSelect: z.int().min(0).max(99),
  quantityPerSelection: z.int().min(1).max(99),
  sortOrder: z.int().min(0).max(9999),
  isRequired: z.boolean(),
  choices: z.array(adminConfigOptionChoiceSchema).max(24),
});

export const adminConfigDietaryTagSchema = z.strictObject({
  dietaryTagId: z.uuid(),
  verificationStatus: adminDietaryVerificationStatusSchema,
  verifiedAt: isoTimestampSchema.nullable(),
  note: nullableTrimmedText(ADMIN_CATALOG_LIMITS.NOTES_MAX),
});

export const adminConfigAllergenSchema = z.strictObject({
  allergenId: z.uuid(),
  presence: adminAllergenPresenceSchema,
  sourceNote: nullableTrimmedText(ADMIN_CATALOG_LIMITS.NOTES_MAX),
  verifiedAt: isoTimestampSchema.nullable(),
});

export const adminConfigVariantSchema = z.strictObject({
  id: z.uuid(),
  sku: skuSchema,
  name: z
    .string()
    .trim()
    .min(1, { message: 'Nama varian wajib diisi.' })
    .max(200),
  sizeLabel: nullableTrimmedText(200),
  basePriceIdr: z
    .int({ message: 'Harga dasar varian harus bilangan bulat rupiah.' })
    .min(1, { message: 'Harga varian minimal Rp1.' })
    .max(ADMIN_CATALOG_LIMITS.MAX_UNIT_PRICE_IDR),
  status: adminVariantStatusSchema,
  sortOrder: z.int().min(0).max(9999),
  maxQuantityPerOrder: z.int().min(1).max(99),
  isDefault: z.boolean(),
  bundleRecipe: z.literal('chiffon_mix').nullable(),
  bundleUnitsTotal: z.int().min(1).max(99).nullable(),
  bundleRulesVerified: z.boolean(),
  fixedComponents: z.array(adminConfigFixedComponentSchema).max(10),
  optionGroups: z.array(adminConfigOptionGroupSchema).max(10),
  dietaryTags: z.array(adminConfigDietaryTagSchema).max(20),
  allergens: z.array(adminConfigAllergenSchema).max(30),
});

export const adminConfigImageSchema = z.strictObject({
  id: z.uuid(),
  variantId: z.uuid().nullable(),
  storageBucket: adminStorageBucketSchema,
  storagePath: z.string().trim().min(1).max(500),
  altText: nullableTrimmedText(ADMIN_MEDIA_LIMITS.ALT_TEXT_MAX),
  isApproved: z.boolean(),
  isPrimary: z.boolean(),
  sortOrder: z.int().min(0).max(9999),
});

export const saveProductConfigurationSchema = z.strictObject({
  expectedUpdatedAt: isoTimestampSchema,
  product: z.strictObject({
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
  }),
  categories: z.array(adminConfigCategorySchema).max(20),
  variants: z.array(adminConfigVariantSchema).min(1).max(30),
  images: z.array(adminConfigImageSchema).max(30),
});

export const adminReferenceDietaryTagSchema = z.strictObject({
  id: z.uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
});

export const adminReferenceAllergenSchema = z.strictObject({
  id: z.uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
});

export const adminReferenceComponentVariantSchema = z.strictObject({
  id: z.uuid(),
  productId: z.uuid(),
  productName: z.string().min(1),
  productSlug: z.string().min(1),
  productStatus: adminCatalogStatusSchema,
  productType: adminProductTypeSchema,
  sku: z.string().min(1),
  variantName: z.string().min(1),
  sizeLabel: z.string().nullable(),
  basePriceIdr: z.int().nonnegative(),
  status: adminVariantStatusSchema,
  isGlutenFreeVerified: z.boolean(),
  listedBranchCount: z.int().nonnegative(),
});

export const adminEditorVariantSchema = adminConfigVariantSchema.extend({
  branchOfferCount: z.int().nonnegative(),
});

export const adminEditorImageSchema = adminConfigImageSchema.extend({
  previewUrl: z.string().min(1).nullable(),
});

export const adminProductEditorAggregateSchema = z.strictObject({
  product: adminProductItemSchema.extend({
    shortDescription: z.string().nullable(),
    description: z.string().nullable(),
    ingredientsInfo: z.string().nullable(),
    storageInstructions: z.string().nullable(),
  }),
  categories: z.array(adminConfigCategorySchema),
  variants: z.array(adminEditorVariantSchema),
  images: z.array(adminEditorImageSchema),
  referenceData: z.strictObject({
    categories: z.array(adminCategoryItemSchema),
    dietaryTags: z.array(adminReferenceDietaryTagSchema),
    allergens: z.array(adminReferenceAllergenSchema),
    componentVariants: z.array(adminReferenceComponentVariantSchema),
  }),
});

export const adminProductDetailAggregateResponseSchema = z.strictObject({
  product: adminProductItemSchema,
  editor: adminProductEditorAggregateSchema,
});

export const adminProductBootstrapResponseSchema = z.strictObject({
  categories: z.array(adminCategoryItemSchema),
  dietaryTags: z.array(adminReferenceDietaryTagSchema),
  allergens: z.array(adminReferenceAllergenSchema),
  componentVariants: z.array(adminReferenceComponentVariantSchema),
});

export const adminSaveConfigurationResponseSchema = z.strictObject({
  productId: z.uuid(),
  updatedAt: isoTimestampSchema,
  editor: adminProductEditorAggregateSchema,
});

export const adminMediaUploadResponseSchema = z.strictObject({
  storageBucket: z.literal(ADMIN_MEDIA_BUCKETS.DRAFTS),
  storagePath: z.string().min(1),
  previewUrl: z.string().min(1),
  mimeType: z.enum(ADMIN_MEDIA_ALLOWED_MIME_TYPES),
  byteSize: z.int().positive().max(ADMIN_MEDIA_LIMITS.MAX_FILE_BYTES),
  width: z.int().positive().max(ADMIN_MEDIA_LIMITS.MAX_DIMENSION_PX),
  height: z.int().positive().max(ADMIN_MEDIA_LIMITS.MAX_DIMENSION_PX),
  originalFileName: z.string().min(1).max(120),
});
