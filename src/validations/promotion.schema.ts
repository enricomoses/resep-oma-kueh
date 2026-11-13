import { z } from 'zod';
import {
  PROMOTION_CLOCK_STATES,
  PROMOTION_DISCOUNT_TYPES,
  PROMOTION_LIMITS,
  PROMOTION_SCOPES,
  PROMOTION_STATUSES,
} from '@/constants/promotion.constant';

const HTML_TAG_REGEX = /<[^>]*>/;

const safePlainText = (maxLen: number) =>
  z
    .string()
    .trim()
    .min(1, { message: 'Bidang teks wajib diisi.' })
    .max(maxLen)
    .refine((value) => !HTML_TAG_REGEX.test(value), {
      message: 'Tag HTML mentah tidak diizinkan.',
    });

const optionalPlainText = (maxLen: number) =>
  z
    .string()
    .trim()
    .max(maxLen)
    .refine((value) => !HTML_TAG_REGEX.test(value), {
      message: 'Tag HTML mentah tidak diizinkan.',
    })
    .transform((value) => (value.length === 0 ? null : value))
    .nullable();

const slugSchema = z
  .string()
  .trim()
  .min(1, { message: 'Slug promosi wajib diisi.' })
  .max(PROMOTION_LIMITS.SLUG_MAX)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'Slug hanya boleh huruf kecil, angka, dan tanda hubung (contoh: promo-akhir-pekan).',
  });

const isoTimestampSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => Number.isFinite(Date.parse(value)), {
    message: 'Format tanggal dan waktu harus ISO timestamp yang valid.',
  });

const approvedBannerPathSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .regex(/^approved\/[a-zA-Z0-9._/-]+$/, {
    message: 'Path banner terpublikasi harus berada pada folder approved/.',
  });

const draftMediaPathSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .regex(/^drafts\/[a-zA-Z0-9._/-]+$/, {
    message: 'Path draft media harus berada pada folder drafts/.',
  });

export const promotionDiscountTypeSchema = z.enum(PROMOTION_DISCOUNT_TYPES);
export const promotionScopeSchema = z.enum(PROMOTION_SCOPES);
export const promotionStatusSchema = z.enum(PROMOTION_STATUSES);
export const promotionClockStateSchema = z.enum(PROMOTION_CLOCK_STATES);

export const publicPromotionsQuerySchema = z.strictObject({
  branch: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
});

export const publicPromotionItemSchema = z.strictObject({
  id: z.uuid(),
  title: safePlainText(PROMOTION_LIMITS.TITLE_MAX),
  slug: slugSchema,
  description: optionalPlainText(PROMOTION_LIMITS.DESCRIPTION_MAX),
  discountType: promotionDiscountTypeSchema,
  discountValue: z.number().positive(),
  minSpendIdr: z.int().nonnegative(),
  maxDiscountIdr: z.int().nonnegative().nullable(),
  scope: promotionScopeSchema,
  priority: z.int(),
  startsAt: isoTimestampSchema,
  endsAt: isoTimestampSchema,
  bannerImagePath: approvedBannerPathSchema.nullable(),
  bannerImageUrl: z.string().min(1).max(2000).nullable(),
  branchIds: z.array(z.uuid()),
  targetCategoryIds: z.array(z.uuid()),
  targetProductIds: z.array(z.uuid()),
  targetVariantIds: z.array(z.uuid()),
});

export const publicShippingBannerSchema = z.strictObject({
  title: safePlainText(PROMOTION_LIMITS.SHIPPING_TITLE_MAX),
  body: safePlainText(PROMOTION_LIMITS.SHIPPING_BODY_MAX),
  updatedAt: isoTimestampSchema.nullable(),
});

export const publicPromotionsResponseSchema = z.strictObject({
  resolvedBranchId: z.uuid().nullable(),
  promotions: z.array(publicPromotionItemSchema).max(50),
  shippingBanner: publicShippingBannerSchema.nullable(),
});

export const adminPromotionTargetSummarySchema = z.strictObject({
  id: z.uuid(),
  label: safePlainText(250),
  secondaryLabel: z.string().max(150).nullable(),
  isPublishEligible: z.boolean(),
});

export const adminPromotionItemSchema = z.strictObject({
  id: z.uuid(),
  title: safePlainText(PROMOTION_LIMITS.TITLE_MAX),
  slug: slugSchema,
  description: optionalPlainText(PROMOTION_LIMITS.DESCRIPTION_MAX),
  discountType: promotionDiscountTypeSchema,
  discountValue: z.number().positive(),
  minSpendIdr: z.int().nonnegative(),
  maxDiscountIdr: z.int().nonnegative().nullable(),
  scope: promotionScopeSchema,
  startsAt: isoTimestampSchema,
  endsAt: isoTimestampSchema,
  priority: z.int(),
  status: promotionStatusSchema,
  isEnabled: z.boolean(),
  isStackable: z.literal(false),
  clockState: promotionClockStateSchema,
  bannerImagePath: z.string().max(500).nullable(),
  bannerImageUrl: z.string().max(2000).nullable(),
  branchIds: z.array(z.uuid()),
  categoryIds: z.array(z.uuid()),
  productIds: z.array(z.uuid()),
  variantIds: z.array(z.uuid()),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

export const adminShippingBannerItemSchema = z.strictObject({
  title: z.string().max(PROMOTION_LIMITS.SHIPPING_TITLE_MAX),
  body: z.string().max(PROMOTION_LIMITS.SHIPPING_BODY_MAX),
  status: z.enum(['draft', 'published']),
  updatedAt: isoTimestampSchema.nullable(),
});

export const adminPromotionReferenceOptionsSchema = z.strictObject({
  branches: z.array(
    z.strictObject({
      id: z.uuid(),
      code: slugSchema,
      name: safePlainText(200),
      isActive: z.boolean(),
    }),
  ),
  categories: z.array(adminPromotionTargetSummarySchema),
  products: z.array(adminPromotionTargetSummarySchema),
  variants: z.array(adminPromotionTargetSummarySchema),
});

export const adminPromotionsListResponseSchema = z.strictObject({
  promotions: z.array(adminPromotionItemSchema),
  shippingBanner: adminShippingBannerItemSchema,
  references: adminPromotionReferenceOptionsSchema,
});

export const saveAdminPromotionSchema = z
  .strictObject({
    expectedUpdatedAt: isoTimestampSchema.nullable(),
    title: safePlainText(PROMOTION_LIMITS.TITLE_MAX),
    slug: slugSchema,
    description: optionalPlainText(PROMOTION_LIMITS.DESCRIPTION_MAX),
    discountType: promotionDiscountTypeSchema,
    discountValue: z
      .number({ message: 'Nilai diskon harus berupa angka.' })
      .finite()
      .positive({ message: 'Nilai diskon harus lebih besar dari 0.' })
      .max(PROMOTION_LIMITS.MAX_DISCOUNT_IDR),
    maxDiscountIdr: z
      .int({ message: 'Batas diskon per baris harus bilangan bulat rupiah.' })
      .min(0)
      .max(PROMOTION_LIMITS.MAX_DISCOUNT_IDR)
      .nullable(),
    minSpendIdr: z
      .int({ message: 'Minimum belanja harus bilangan bulat rupiah.' })
      .min(0)
      .max(PROMOTION_LIMITS.MAX_DISCOUNT_IDR),
    scope: promotionScopeSchema,
    startsAt: isoTimestampSchema,
    endsAt: isoTimestampSchema,
    priority: z
      .int()
      .min(PROMOTION_LIMITS.MIN_PRIORITY)
      .max(PROMOTION_LIMITS.MAX_PRIORITY),
    status: promotionStatusSchema,
    isEnabled: z.boolean(),
    isStackable: z.literal(false, {
      message: 'Promosi harus bersifat non-stackable (false).',
    }),
    bannerImagePath: approvedBannerPathSchema.nullable(),
    bannerDraftPath: draftMediaPathSchema.nullable().optional(),
    branchIds: z.array(z.uuid()).max(PROMOTION_LIMITS.MAX_BRANCH_IDS),
    categoryIds: z.array(z.uuid()).max(PROMOTION_LIMITS.MAX_TARGETS),
    productIds: z.array(z.uuid()).max(PROMOTION_LIMITS.MAX_TARGETS),
    variantIds: z.array(z.uuid()).max(PROMOTION_LIMITS.MAX_TARGETS),
  })
  .superRefine((value, ctx) => {
    if (Date.parse(value.endsAt) <= Date.parse(value.startsAt)) {
      ctx.addIssue({
        code: 'custom',
        path: ['endsAt'],
        message: 'Waktu berakhir harus lebih lambat dari waktu mulai.',
      });
    }

    if (value.discountType === 'percentage') {
      if (value.discountValue > PROMOTION_LIMITS.MAX_PERCENTAGE) {
        ctx.addIssue({
          code: 'custom',
          path: ['discountValue'],
          message: 'Persentase diskon maksimal 100%.',
        });
      }
      if (Math.round(value.discountValue * 100) !== value.discountValue * 100) {
        ctx.addIssue({
          code: 'custom',
          path: ['discountValue'],
          message: 'Persentase diskon mendukung maksimal 2 angka desimal.',
        });
      }
    } else if (!Number.isInteger(value.discountValue)) {
      ctx.addIssue({
        code: 'custom',
        path: ['discountValue'],
        message: 'Diskon nominal tetap harus berupa bilangan bulat rupiah.',
      });
    }

    if (value.scope === 'all') {
      if (
        value.categoryIds.length > 0 ||
        value.productIds.length > 0 ||
        value.variantIds.length > 0
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['scope'],
          message:
            'Scope semua produk tidak boleh memiliki target kategori, produk, atau varian.',
        });
      }
    } else if (value.scope === 'category') {
      if (value.productIds.length > 0 || value.variantIds.length > 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['categoryIds'],
          message:
            'Target produk/varian harus kosong saat scope kategori dipilih.',
        });
      }
      if (value.status === 'published' && value.categoryIds.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['categoryIds'],
          message: 'Pilih minimal satu kategori untuk mempublikasikan promosi.',
        });
      }
    } else if (value.scope === 'product') {
      if (value.categoryIds.length > 0 || value.variantIds.length > 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['productIds'],
          message:
            'Target kategori/varian harus kosong saat scope produk dipilih.',
        });
      }
      if (value.status === 'published' && value.productIds.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['productIds'],
          message: 'Pilih minimal satu produk untuk mempublikasikan promosi.',
        });
      }
    } else if (value.scope === 'variant') {
      if (value.categoryIds.length > 0 || value.productIds.length > 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['variantIds'],
          message:
            'Target kategori/produk harus kosong saat scope varian dipilih.',
        });
      }
      if (value.status === 'published' && value.variantIds.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['variantIds'],
          message: 'Pilih minimal satu varian untuk mempublikasikan promosi.',
        });
      }
    }
  });

export const adminPromotionMutationResponseSchema = z.strictObject({
  promotion: adminPromotionItemSchema,
});

export const saveAdminShippingBannerSchema = z.strictObject({
  expectedUpdatedAt: isoTimestampSchema.nullable(),
  title: safePlainText(PROMOTION_LIMITS.SHIPPING_TITLE_MAX),
  body: safePlainText(PROMOTION_LIMITS.SHIPPING_BODY_MAX),
  status: z.enum(['draft', 'published']),
});

export const adminShippingBannerMutationResponseSchema = z.strictObject({
  shippingBanner: adminShippingBannerItemSchema,
});
