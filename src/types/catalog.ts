import type { z } from 'zod';
import type {
  bundleBreakdownItemSchema,
  catalogDietaryTagSchema,
  catalogDirectorySchema,
  catalogProductItemSchema,
  catalogQuerySchema,
  preparedCartLinePayloadSchema,
  productDetailAllergenSchema,
  productDetailComponentVariantSummarySchema,
  productDetailFixedComponentSchema,
  productDetailImageSchema,
  productDetailOptionChoiceSchema,
  productDetailOptionGroupSchema,
  productDetailSchema,
  productDetailVariantSchema,
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
export type ProductDetailImage = z.infer<typeof productDetailImageSchema>;
export type ProductDetailAllergen = z.infer<typeof productDetailAllergenSchema>;
export type ProductDetailVariant = z.infer<typeof productDetailVariantSchema>;
export type ProductDetail = z.infer<typeof productDetailSchema>;
export type ProductDetailOptionChoice = z.infer<
  typeof productDetailOptionChoiceSchema
>;
export type ProductDetailOptionGroup = z.infer<
  typeof productDetailOptionGroupSchema
>;
export type ProductDetailFixedComponent = z.infer<
  typeof productDetailFixedComponentSchema
>;
export type ProductDetailComponentVariantSummary = z.infer<
  typeof productDetailComponentVariantSummarySchema
>;
export type BundleBreakdownItem = z.infer<typeof bundleBreakdownItemSchema>;
export type PreparedCartLinePayload = z.infer<
  typeof preparedCartLinePayloadSchema
>;

type BundleValidationErrorCode =
  | 'NOT_A_BUNDLE'
  | 'BUNDLE_NOT_VERIFIED'
  | 'INVALID_TOTAL_UNITS'
  | 'FOREIGN_CHOICE'
  | 'CHOICE_INACTIVE'
  | 'GROUP_SELECTION_COUNT_MISMATCH'
  | 'DUPLICATE_CHOICE'
  | 'DUPLICATE_FLAVOUR'
  | 'GF_UNVERIFIED_COMPONENT'
  | 'COMPONENT_NOT_OFFERED'
  | 'COMPONENT_SOLD_OUT'
  | 'PRICE_EXCEEDS_CAP';

export interface BundleValidationError {
  code: BundleValidationErrorCode;
  message: string;
  groupId?: string;
  choiceId?: string;
  componentVariantId?: string;
}

export interface SelectedChoiceDetail {
  groupId: string;
  groupName: string;
  choiceId: string;
  label: string;
  quantity: number;
  priceDeltaIdr: number;
  componentVariantId: string | null;
}

export interface FixedComponentDetail {
  id: string;
  slot: string;
  variantId: string;
  quantity: number;
  label: string;
}

interface BundleValidationSuccess {
  isValid: true;
  variantId: string;
  sku: string;
  bundleSignature: string;
  bundleUnitsTotal: number;
  baseOrOverrideIdr: number;
  choiceDeltasTotalIdr: number;
  unitGrossIdr: number;
  effectivePriceIdr: number;
  breakdown: BundleBreakdownItem[];
  fixedComponents: FixedComponentDetail[];
  selectedChoices: SelectedChoiceDetail[];
  errors: [];
}

interface BundleValidationFailure {
  isValid: false;
  variantId: string;
  sku: string;
  bundleSignature: string | null;
  bundleUnitsTotal: number;
  baseOrOverrideIdr: number;
  choiceDeltasTotalIdr: number;
  unitGrossIdr: number;
  effectivePriceIdr: number;
  breakdown: BundleBreakdownItem[];
  fixedComponents: FixedComponentDetail[];
  selectedChoices: SelectedChoiceDetail[];
  errors: BundleValidationError[];
}

export type BundleValidationResult =
  BundleValidationSuccess | BundleValidationFailure;
