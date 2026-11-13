import { z } from 'zod';
import { HOME_LIMITS } from '@/constants/home.constant';
import { publicShippingBannerSchema } from '@/validations/promotion.schema';

const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const plainTextLabelSchema = z.string().trim().min(1).max(200);
const plainTextBodySchema = z.string().trim().min(1).max(10_000);

export const cmsHeroPayloadSchema = z
  .object({
    headline: plainTextLabelSchema,
    subcopy: plainTextBodySchema,
    image_path: z.string().min(1).max(500).optional(),
    image_alt: plainTextLabelSchema.optional(),
    media_approved: z.boolean().optional(),
  })
  .strict();

export const cmsEditorialPayloadSchema = z
  .object({
    title: plainTextLabelSchema,
    body: plainTextBodySchema,
    image_path: z.string().min(1).max(500).optional(),
    image_alt: plainTextLabelSchema.optional(),
    media_approved: z.boolean().optional(),
  })
  .strict();

const cmsInstagramItemSchema = z
  .object({
    image_path: z.string().min(1).max(500),
    alt: plainTextLabelSchema,
    href: z.url().startsWith('https://www.instagram.com/'),
    media_approved: z.literal(true),
  })
  .strict();

export const cmsInstagramPayloadSchema = z
  .object({
    url: z.url().startsWith('https://www.instagram.com/'),
    items: z.array(cmsInstagramItemSchema).max(12),
  })
  .strict();

const homeHeroContentSchema = z
  .object({
    headline: plainTextLabelSchema,
    subcopy: plainTextBodySchema,
    imageAlt: plainTextLabelSchema,
    imageUrl: z.url().max(2000).nullable().optional(),
  })
  .strict();

const homeStoryContentSchema = z
  .object({
    title: plainTextLabelSchema,
    body: plainTextBodySchema,
    imageAlt: plainTextLabelSchema,
    imageUrl: z.url().max(2000).nullable().optional(),
  })
  .strict();

const homeSimpleBlockContentSchema = z
  .object({
    title: plainTextLabelSchema,
    body: plainTextBodySchema,
    imageAlt: plainTextLabelSchema.optional(),
    imageUrl: z.url().max(2000).nullable().optional(),
  })
  .strict();

const homeInstagramItemSchema = z
  .object({
    imageUrl: z.url().max(2000).nullable(),
    alt: plainTextLabelSchema,
    href: z.url().startsWith('https://www.instagram.com/'),
  })
  .strict();

const homeInstagramContentSchema = z
  .object({
    url: z.url().startsWith('https://www.instagram.com/'),
    items: z.array(homeInstagramItemSchema).max(12).optional(),
  })
  .strict();

export const homeContentBundleSchema = z
  .object({
    hero: homeHeroContentSchema,
    story: homeStoryContentSchema,
    customBusiness: homeSimpleBlockContentSchema,
    classPromo: homeSimpleBlockContentSchema,
    instagram: homeInstagramContentSchema,
  })
  .strict();

export const homeCategorySchema = z
  .object({
    id: z.uuid(),
    name: plainTextLabelSchema,
    slug: slugSchema,
    description: z.string().max(1000).nullable(),
    sortOrder: z.number().int(),
  })
  .strict();

export const homeFeaturedProductSchema = z
  .object({
    id: z.uuid(),
    name: plainTextLabelSchema,
    slug: slugSchema,
    shortDescription: z.string().max(500).nullable(),
    description: z.string().max(2000).nullable(),
    productType: z.enum(['simple', 'variants', 'bundle']),
    isBestSeller: z.boolean(),
    isNew: z.boolean(),
    primaryCategory: z
      .object({
        name: plainTextLabelSchema,
        slug: slugSchema,
      })
      .strict()
      .nullable(),
    imageAlt: plainTextLabelSchema,
    branchFromPriceIdr: z
      .record(z.string(), z.number().int().nonnegative())
      .optional(),
    branchPromotions: z
      .record(
        z.string(),
        z
          .object({
            badgeTitle: plainTextLabelSchema,
            originalFromPriceIdr: z.number().int().nonnegative(),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();

export const homePromotionSchema = z
  .object({
    id: z.uuid(),
    title: plainTextLabelSchema,
    slug: slugSchema,
    description: z.string().max(2000).nullable(),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().positive(),
    minSpendIdr: z.number().int().nonnegative(),
    maxDiscountIdr: z.number().int().nonnegative().nullable(),
    scope: z.enum(['all', 'category', 'product', 'variant']),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
    branchIds: z.array(z.uuid()),
    bannerImageUrl: z.string().max(2000).nullable().optional(),
  })
  .strict();

export const homeUpcomingSessionSchema = z
  .object({
    id: z.uuid(),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
    registrationDeadlineAt: z.string().min(1).nullable(),
    capacity: z.number().int().positive(),
    seatsLeft: z.number().int().nonnegative().nullable(),
    branch: z
      .object({
        id: z.uuid(),
        code: slugSchema,
        name: plainTextLabelSchema,
        city: plainTextLabelSchema,
      })
      .strict(),
    program: z
      .object({
        id: z.uuid(),
        title: plainTextLabelSchema,
        slug: slugSchema,
        shortDescription: z.string().max(500).nullable(),
        description: z.string().max(2000),
        ageMin: z.number().int().nonnegative().nullable(),
        ageMax: z.number().int().nonnegative().nullable(),
        durationMinutes: z.number().int().positive().nullable(),
        coverAlt: plainTextLabelSchema,
      })
      .strict(),
  })
  .strict();

export const homeTestimonialSchema = z
  .object({
    id: z.uuid(),
    displayName: plainTextLabelSchema,
    quote: plainTextBodySchema,
    rating: z.number().int().min(1).max(5).nullable(),
    sourceLabel: plainTextLabelSchema,
  })
  .strict();

function createSectionResultSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.discriminatedUnion('status', [
    z.object({ status: z.literal('success'), data: dataSchema }).strict(),
    z.object({ status: z.literal('error') }).strict(),
  ]);
}

export const homePageDataSchema = z
  .object({
    content: createSectionResultSchema(homeContentBundleSchema),
    categories: createSectionResultSchema(
      z.array(homeCategorySchema).max(HOME_LIMITS.SERIES),
    ),
    featuredProducts: createSectionResultSchema(
      z.array(homeFeaturedProductSchema).max(HOME_LIMITS.FEATURED),
    ),
    promotions: createSectionResultSchema(
      z.array(homePromotionSchema).max(HOME_LIMITS.PROMOTIONS),
    ),
    upcomingClasses: createSectionResultSchema(
      z.array(homeUpcomingSessionSchema).max(HOME_LIMITS.CLASSES),
    ),
    testimonials: createSectionResultSchema(
      z.array(homeTestimonialSchema).max(HOME_LIMITS.TESTIMONIALS),
    ),
    shippingBanner: publicShippingBannerSchema.nullable().optional(),
  })
  .strict();
