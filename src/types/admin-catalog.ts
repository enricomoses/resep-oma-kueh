import type { z } from 'zod';

import type {
  adminAllergenPresenceSchema,
  adminCatalogStatusSchema,
  adminCategoryItemSchema,
  adminCategoryListResponseSchema,
  adminConfigAllergenSchema,
  adminConfigCategorySchema,
  adminConfigDietaryTagSchema,
  adminConfigFixedComponentSchema,
  adminConfigImageSchema,
  adminConfigOptionChoiceSchema,
  adminConfigOptionGroupSchema,
  adminConfigVariantSchema,
  adminDietaryVerificationStatusSchema,
  adminEditorImageSchema,
  adminEditorVariantSchema,
  adminMediaUploadResponseSchema,
  adminOverviewResponseSchema,
  adminProductBootstrapResponseSchema,
  adminProductEditorAggregateSchema,
  adminProductItemSchema,
  adminProductListResponseSchema,
  adminProductQuerySchema,
  adminProductTypeSchema,
  adminReferenceAllergenSchema,
  adminReferenceComponentVariantSchema,
  adminReferenceDietaryTagSchema,
  adminSaveConfigurationResponseSchema,
  adminVariantStatusSchema,
  archiveAdminEntitySchema,
  createAdminCategorySchema,
  createAdminProductSchema,
  saveProductConfigurationSchema,
  updateAdminCategorySchema,
  updateAdminProductSchema,
} from '@/validations/admin-catalog.schema';

export type AdminCatalogStatus = z.infer<typeof adminCatalogStatusSchema>;
export type AdminProductType = z.infer<typeof adminProductTypeSchema>;
export type AdminVariantStatus = z.infer<typeof adminVariantStatusSchema>;
export type AdminDietaryVerificationStatus = z.infer<
  typeof adminDietaryVerificationStatusSchema
>;
export type AdminAllergenPresence = z.infer<typeof adminAllergenPresenceSchema>;

export type AdminOverviewResponse = z.infer<typeof adminOverviewResponseSchema>;
export type AdminCategoryItem = z.infer<typeof adminCategoryItemSchema>;
export type AdminCategoryListResponse = z.infer<
  typeof adminCategoryListResponseSchema
>;
export type CreateAdminCategoryInput = z.infer<
  typeof createAdminCategorySchema
>;
export type UpdateAdminCategoryInput = z.infer<
  typeof updateAdminCategorySchema
>;
export type ArchiveAdminEntityInput = z.infer<typeof archiveAdminEntitySchema>;

export type AdminProductItem = z.infer<typeof adminProductItemSchema>;
export type AdminProductQuery = z.infer<typeof adminProductQuerySchema>;
export type AdminProductListResponse = z.infer<
  typeof adminProductListResponseSchema
>;
export type CreateAdminProductInput = z.infer<typeof createAdminProductSchema>;
export type UpdateAdminProductInput = z.infer<typeof updateAdminProductSchema>;

export type AdminConfigCategory = z.infer<typeof adminConfigCategorySchema>;
export type AdminConfigFixedComponent = z.infer<
  typeof adminConfigFixedComponentSchema
>;
export type AdminConfigOptionChoice = z.infer<
  typeof adminConfigOptionChoiceSchema
>;
export type AdminConfigOptionGroup = z.infer<
  typeof adminConfigOptionGroupSchema
>;
export type AdminConfigDietaryTag = z.infer<typeof adminConfigDietaryTagSchema>;
export type AdminConfigAllergen = z.infer<typeof adminConfigAllergenSchema>;
export type AdminConfigVariant = z.infer<typeof adminConfigVariantSchema>;
export type AdminConfigImage = z.infer<typeof adminConfigImageSchema>;

export type AdminEditorVariant = z.infer<typeof adminEditorVariantSchema>;
export type AdminEditorImage = z.infer<typeof adminEditorImageSchema>;
export type AdminReferenceDietaryTag = z.infer<
  typeof adminReferenceDietaryTagSchema
>;
export type AdminReferenceAllergen = z.infer<
  typeof adminReferenceAllergenSchema
>;
export type AdminReferenceComponentVariant = z.infer<
  typeof adminReferenceComponentVariantSchema
>;
export type AdminProductEditorAggregate = z.infer<
  typeof adminProductEditorAggregateSchema
>;
export type AdminProductBootstrapResponse = z.infer<
  typeof adminProductBootstrapResponseSchema
>;
export type SaveProductConfigurationInput = z.infer<
  typeof saveProductConfigurationSchema
>;
export type AdminSaveConfigurationResponse = z.infer<
  typeof adminSaveConfigurationResponseSchema
>;
export type AdminMediaUploadResponse = z.infer<
  typeof adminMediaUploadResponseSchema
>;
