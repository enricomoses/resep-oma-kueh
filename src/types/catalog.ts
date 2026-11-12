import type { z } from 'zod';
import type {
  catalogDietaryTagSchema,
  catalogDirectorySchema,
  catalogProductItemSchema,
  catalogQuerySchema,
  publicCategoryDirectorySchema,
  publicCategorySchema,
} from '@/validations/catalog.schema';

export type CatalogQueryInput = z.input<typeof catalogQuerySchema>;
export type PublicCategory = z.infer<typeof publicCategorySchema>;
export type PublicCategoryDirectory = z.infer<
  typeof publicCategoryDirectorySchema
>;
export type CatalogDietaryTag = z.infer<typeof catalogDietaryTagSchema>;
export type CatalogProductItem = z.infer<typeof catalogProductItemSchema>;
export type CatalogDirectory = z.infer<typeof catalogDirectorySchema>;
