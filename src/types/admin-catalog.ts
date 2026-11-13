import type { z } from 'zod';

import type {
  adminCatalogStatusSchema,
  adminCategoryItemSchema,
  adminCategoryListResponseSchema,
  adminOverviewResponseSchema,
  adminProductItemSchema,
  adminProductListResponseSchema,
  adminProductQuerySchema,
  adminProductTypeSchema,
  archiveAdminEntitySchema,
  createAdminCategorySchema,
  createAdminProductSchema,
  updateAdminCategorySchema,
  updateAdminProductSchema,
} from '@/validations/admin-catalog.schema';

export type AdminCatalogStatus = z.infer<typeof adminCatalogStatusSchema>;
export type AdminProductType = z.infer<typeof adminProductTypeSchema>;

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
