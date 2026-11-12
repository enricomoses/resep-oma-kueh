import { z } from 'zod';
import { CONTENT_LIMITS, PUBLIC_CMS_KEYS } from '@/constants/content.constant';

const HTML_TAG_REGEX = /<[^>]*>/;

const safePlainText = (maxLen: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(maxLen)
    .refine((value) => !HTML_TAG_REGEX.test(value), {
      message: 'Raw HTML tags are not permitted in plain-text CMS content.',
    });

export const publicCmsKeySchema = z.enum(PUBLIC_CMS_KEYS);

export const contentQuerySchema = z
  .object({
    keys: z
      .string()
      .trim()
      .min(1)
      .max(600)
      .transform((raw) =>
        raw
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
      )
      .pipe(
        z
          .array(publicCmsKeySchema)
          .min(1)
          .max(CONTENT_LIMITS.MAX_KEYS_QUERY)
          .transform((items) => [...new Set(items)]),
      )
      .optional(),
  })
  .strict();

const cmsBusinessContactsPayloadSchema = z
  .object({
    email: z.email().max(200),
    instagram_url: z.url().startsWith('https://www.instagram.com/'),
  })
  .strict();

const cmsHeroBlockPayloadSchema = z
  .object({
    headline: safePlainText(200),
    subcopy: safePlainText(10_000),
    image_path: safePlainText(500).optional(),
    image_alt: safePlainText(200).optional(),
    media_approved: z.boolean().optional(),
  })
  .strict();

const cmsTitleBodyPayloadSchema = z
  .object({
    title: safePlainText(200),
    body: safePlainText(10_000),
    image_path: safePlainText(500).optional(),
    image_alt: safePlainText(200).optional(),
    media_approved: z.boolean().optional(),
  })
  .strict();

const cmsAboutValuesPayloadSchema = z
  .object({
    items: z.array(safePlainText(120)).min(1).max(12),
  })
  .strict();

const cmsFooterNotePayloadSchema = z
  .object({
    text: safePlainText(1000),
  })
  .strict();

const cmsInstagramFeedItemSchema = z
  .object({
    image_path: safePlainText(500),
    alt: safePlainText(200),
    href: z.url().startsWith('https://www.instagram.com/'),
    media_approved: z.literal(true),
  })
  .strict();

const cmsCommunityInstagramPayloadSchema = z
  .object({
    url: z.url().startsWith('https://www.instagram.com/'),
    items: z.array(cmsInstagramFeedItemSchema).max(12),
  })
  .strict();

export const cmsPayloadSchemasByKey = {
  'business.contacts': cmsBusinessContactsPayloadSchema,
  'home.hero': cmsHeroBlockPayloadSchema,
  'home.story': cmsTitleBodyPayloadSchema,
  'home.class_promo': cmsTitleBodyPayloadSchema,
  'home.custom_business': cmsTitleBodyPayloadSchema,
  'about.story': cmsTitleBodyPayloadSchema,
  'about.values': cmsAboutValuesPayloadSchema,
  'footer.note': cmsFooterNotePayloadSchema,
  'legal.privacy': cmsTitleBodyPayloadSchema,
  'legal.ordering_policy': cmsTitleBodyPayloadSchema,
  'community.instagram': cmsCommunityInstagramPayloadSchema,
} as const;

const contentSourceSchema = z.enum(['published', 'template']);

export const publicCmsEntrySchema = z.discriminatedUnion('key', [
  z
    .object({
      key: z.literal('business.contacts'),
      source: contentSourceSchema,
      updatedAt: z.string().nullable(),
      content: cmsBusinessContactsPayloadSchema,
    })
    .strict(),
  z
    .object({
      key: z.literal('home.hero'),
      source: contentSourceSchema,
      updatedAt: z.string().nullable(),
      content: cmsHeroBlockPayloadSchema,
    })
    .strict(),
  z
    .object({
      key: z.literal('home.story'),
      source: contentSourceSchema,
      updatedAt: z.string().nullable(),
      content: cmsTitleBodyPayloadSchema,
    })
    .strict(),
  z
    .object({
      key: z.literal('home.class_promo'),
      source: contentSourceSchema,
      updatedAt: z.string().nullable(),
      content: cmsTitleBodyPayloadSchema,
    })
    .strict(),
  z
    .object({
      key: z.literal('home.custom_business'),
      source: contentSourceSchema,
      updatedAt: z.string().nullable(),
      content: cmsTitleBodyPayloadSchema,
    })
    .strict(),
  z
    .object({
      key: z.literal('about.story'),
      source: contentSourceSchema,
      updatedAt: z.string().nullable(),
      content: cmsTitleBodyPayloadSchema,
    })
    .strict(),
  z
    .object({
      key: z.literal('about.values'),
      source: contentSourceSchema,
      updatedAt: z.string().nullable(),
      content: cmsAboutValuesPayloadSchema,
    })
    .strict(),
  z
    .object({
      key: z.literal('footer.note'),
      source: contentSourceSchema,
      updatedAt: z.string().nullable(),
      content: cmsFooterNotePayloadSchema,
    })
    .strict(),
  z
    .object({
      key: z.literal('legal.privacy'),
      source: contentSourceSchema,
      updatedAt: z.string().nullable(),
      content: cmsTitleBodyPayloadSchema,
    })
    .strict(),
  z
    .object({
      key: z.literal('legal.ordering_policy'),
      source: contentSourceSchema,
      updatedAt: z.string().nullable(),
      content: cmsTitleBodyPayloadSchema,
    })
    .strict(),
  z
    .object({
      key: z.literal('community.instagram'),
      source: contentSourceSchema,
      updatedAt: z.string().nullable(),
      content: cmsCommunityInstagramPayloadSchema,
    })
    .strict(),
]);

export const publicContentDirectorySchema = z
  .object({
    items: z.array(publicCmsEntrySchema).max(CONTENT_LIMITS.MAX_KEYS_QUERY),
  })
  .strict();

export const publicFaqItemSchema = z
  .object({
    id: z.uuid(),
    category: safePlainText(200),
    question: safePlainText(200),
    answer: safePlainText(10_000),
    sortOrder: z.number().int(),
  })
  .strict();

export const publicFaqDirectorySchema = z
  .object({
    items: z.array(publicFaqItemSchema).max(CONTENT_LIMITS.MAX_FAQS),
  })
  .strict();

export const publicBranchHourSchema = z
  .object({
    id: z.uuid(),
    branchId: z.uuid(),
    dayOfWeek: z.number().int().min(0).max(6),
    opensAt: safePlainText(32).nullable(),
    closesAt: safePlainText(32).nullable(),
    isClosed: z.boolean(),
    note: safePlainText(1000).nullable(),
  })
  .strict();

const contactBranchInfoSchema = z
  .object({
    id: z.uuid().nullable(),
    code: z.enum(['surabaya', 'bintaro']),
    name: safePlainText(200),
    city: safePlainText(200),
    whatsappNumber: z.string().regex(/^[1-9][0-9]{7,15}$/),
    address: safePlainText(1000).nullable(),
    mapsUrl: z.url().startsWith('https://').max(2000).nullable(),
    hours: z.array(publicBranchHourSchema).max(7),
  })
  .strict();

export const contactPageDataSchema = z
  .object({
    status: z.enum(['success', 'fallback']),
    email: z.email().max(200),
    instagramUrl: z.url().startsWith('https://www.instagram.com/'),
    branches: z.array(contactBranchInfoSchema).min(1).max(8),
    customBusiness: z
      .object({
        source: contentSourceSchema,
        title: safePlainText(200),
        body: safePlainText(10_000),
      })
      .strict(),
  })
  .strict();
