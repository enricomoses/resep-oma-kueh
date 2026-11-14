import type { z } from 'zod';

import type {
  adminPromotionItemSchema,
  adminPromotionReferenceOptionsSchema,
  adminPromotionsListResponseSchema,
  adminPromotionTargetSummarySchema,
  adminShippingBannerItemSchema,
  promotionClockStateSchema,
  promotionDiscountTypeSchema,
  promotionScopeSchema,
  promotionStatusSchema,
  publicPromotionItemSchema,
  publicPromotionsQuerySchema,
  publicPromotionsResponseSchema,
  publicShippingBannerSchema,
  saveAdminPromotionSchema,
  saveAdminShippingBannerSchema,
} from '@/validations/promotion.schema';

type PromotionDiscountType = z.infer<typeof promotionDiscountTypeSchema>;
export type PromotionScope = z.infer<typeof promotionScopeSchema>;
export type PromotionStatus = z.infer<typeof promotionStatusSchema>;
export type PromotionClockState = z.infer<typeof promotionClockStateSchema>;

export type PublicPromotionsQuery = z.infer<typeof publicPromotionsQuerySchema>;
export type PublicPromotionItem = z.infer<typeof publicPromotionItemSchema>;
export type PublicShippingBanner = z.infer<typeof publicShippingBannerSchema>;
export type PublicPromotionsResponse = z.infer<
  typeof publicPromotionsResponseSchema
>;

export type AdminPromotionTargetSummary = z.infer<
  typeof adminPromotionTargetSummarySchema
>;
export type AdminPromotionItem = z.infer<typeof adminPromotionItemSchema>;
export type AdminShippingBannerItem = z.infer<
  typeof adminShippingBannerItemSchema
>;
export type AdminPromotionReferenceOptions = z.infer<
  typeof adminPromotionReferenceOptionsSchema
>;
export type AdminPromotionsListResponse = z.infer<
  typeof adminPromotionsListResponseSchema
>;
export type SaveAdminPromotionInput = z.infer<typeof saveAdminPromotionSchema>;
export type SaveAdminShippingBannerInput = z.infer<
  typeof saveAdminShippingBannerSchema
>;

export interface PromotionFormState {
  id: string | null;
  expectedUpdatedAt: string | null;
  title: string;
  slug: string;
  description: string;
  discountType: PromotionDiscountType;
  discountValue: string;
  maxDiscountIdr: string;
  minSpendIdr: string;
  scope: PromotionScope;
  startsAtLocal: string;
  endsAtLocal: string;
  priority: string;
  status: PromotionStatus;
  isEnabled: boolean;
  bannerImagePath: string | null;
  bannerDraftPath: string | null;
  bannerPreviewUrl: string | null;
  branchIds: string[];
  categoryIds: string[];
  productIds: string[];
  variantIds: string[];
}

export interface ShippingBannerFormState {
  title: string;
  body: string;
  status: 'draft' | 'published';
  expectedUpdatedAt: string | null;
  syncedUpdatedAt: string | null;
}
