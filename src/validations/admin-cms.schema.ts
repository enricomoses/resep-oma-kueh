import { z } from 'zod';

import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import {
  cmsPayloadSchemasByKey,
  publicCmsKeySchema,
} from '@/validations/content.schema';

const UNSAFE_MARKUP_REGEX =
  /<[/!A-Za-z]|<[^>]*>|javascript:|vbscript:|data:text\/html/i;

function safeAdminPlainText(minLen: number, maxLen: number) {
  return z
    .string()
    .trim()
    .min(minLen)
    .max(maxLen)
    .refine((value) => !UNSAFE_MARKUP_REGEX.test(value), {
      message: ADMIN_CATALOG_COPY.CMS.ERRORS.UNSAFE_TEXT,
    });
}

export const adminCmsContentStatusSchema = z.enum(['draft', 'published']);
export const adminPublishingStatusSchema = z.enum([
  'draft',
  'published',
  'archived',
]);

export const safeHttpsSourceUrlSchema = z
  .url()
  .max(2000)
  .refine(
    (value) =>
      value.startsWith('https://') &&
      !/[\s<>"']/.test(value) &&
      !UNSAFE_MARKUP_REGEX.test(value),
    {
      message: ADMIN_CATALOG_COPY.TESTIMONIALS.ERRORS.INVALID_SOURCE_URL,
    },
  );

export const adminCmsEntrySchema = z
  .object({
    key: publicCmsKeySchema,
    status: adminCmsContentStatusSchema,
    content: z.union([
      cmsPayloadSchemasByKey['business.contacts'],
      cmsPayloadSchemasByKey['home.hero'],
      cmsPayloadSchemasByKey['home.story'],
      cmsPayloadSchemasByKey['about.values'],
      cmsPayloadSchemasByKey['footer.note'],
      cmsPayloadSchemasByKey['community.instagram'],
    ]),
    previewImageUrls: z.record(z.string(), z.url().max(2000)),
    updatedBy: z.string().nullable(),
    createdAt: z.string().nullable(),
    updatedAt: z.string().nullable(),
    isPersisted: z.boolean(),
    releaseWarnings: z.array(z.string()),
  })
  .strict();

export const adminCmsListResponseSchema = z
  .object({
    items: z.array(adminCmsEntrySchema),
  })
  .strict();

export const adminCmsMutationResponseSchema = z
  .object({
    item: adminCmsEntrySchema,
  })
  .strict();

export const saveAdminCmsInputSchema = z
  .object({
    status: adminCmsContentStatusSchema,
    expectedUpdatedAt: z.string().min(1).nullable(),
    content: z.record(z.string(), z.unknown()),
  })
  .strict();

export const adminFaqItemSchema = z
  .object({
    id: z.uuid(),
    category: safeAdminPlainText(1, 200),
    question: safeAdminPlainText(1, 200),
    answer: safeAdminPlainText(1, 10_000),
    sortOrder: z.number().int().min(-9999).max(9999),
    status: adminPublishingStatusSchema,
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
  })
  .strict();

export const adminFaqListResponseSchema = z
  .object({
    items: z.array(adminFaqItemSchema),
  })
  .strict();

export const adminFaqMutationResponseSchema = z
  .object({
    faq: adminFaqItemSchema,
  })
  .strict();

export const createAdminFaqInputSchema = z
  .object({
    category: safeAdminPlainText(1, 200),
    question: safeAdminPlainText(1, 200),
    answer: safeAdminPlainText(1, 10_000),
    sortOrder: z.number().int().min(-9999).max(9999).default(0),
    status: adminPublishingStatusSchema.default('draft'),
  })
  .strict();

export const updateAdminFaqInputSchema = createAdminFaqInputSchema
  .extend({
    expectedUpdatedAt: z.string().min(1),
  })
  .strict();

export const archiveAdminCmsEntityInputSchema = z
  .object({
    expectedUpdatedAt: z.string().min(1),
  })
  .strict();

export const adminTestimonialItemSchema = z
  .object({
    id: z.uuid(),
    displayName: safeAdminPlainText(1, 200),
    quote: safeAdminPlainText(1, 10_000),
    rating: z.number().int().min(1).max(5).nullable(),
    sourceLabel: safeAdminPlainText(1, 200).nullable(),
    sourceUrl: safeHttpsSourceUrlSchema.nullable(),
    consentReference: z.string().trim().max(2000).nullable(),
    consentAt: z.string().nullable(),
    status: adminPublishingStatusSchema,
    sortOrder: z.number().int().min(-9999).max(9999),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
  })
  .strict();

export const adminTestimonialListResponseSchema = z
  .object({
    items: z.array(adminTestimonialItemSchema),
  })
  .strict();

export const adminTestimonialMutationResponseSchema = z
  .object({
    testimonial: adminTestimonialItemSchema,
  })
  .strict();

const adminTestimonialBaseSchema = z.object({
  displayName: safeAdminPlainText(1, 200).default('Pelanggan Resep Oma'),
  quote: safeAdminPlainText(1, 10_000),
  rating: z.number().int().min(1).max(5).nullable().default(null),
  sourceLabel: safeAdminPlainText(1, 200).nullable().default(null),
  sourceUrl: safeHttpsSourceUrlSchema.nullable().default(null),
  consentReference: z
    .string()
    .trim()
    .max(2000)
    .refine((value) => !UNSAFE_MARKUP_REGEX.test(value), {
      message: ADMIN_CATALOG_COPY.CMS.ERRORS.UNSAFE_TEXT,
    })
    .nullable()
    .default(null),
  consentAt: z
    .string()
    .trim()
    .max(64)
    .refine(
      (value) => value === '' || !Number.isNaN(Date.parse(value)),
      'Format tanggal persetujuan tidak valid.',
    )
    .nullable()
    .default(null),
  sortOrder: z.number().int().min(-9999).max(9999).default(0),
  status: adminPublishingStatusSchema.default('draft'),
});

function validateTestimonialConsent(
  data: z.infer<typeof adminTestimonialBaseSchema>,
  ctx: z.RefinementCtx,
) {
  if (data.status === 'published') {
    const hasConsentAt = Boolean(
      data.consentAt && data.consentAt.trim().length > 0,
    );
    const hasConsentRef = Boolean(
      data.consentReference && data.consentReference.trim().length > 0,
    );
    if (!hasConsentAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['consentAt'],
        message: ADMIN_CATALOG_COPY.TESTIMONIALS.ERRORS.CONSENT_REQUIRED,
      });
    }
    if (!hasConsentRef) {
      ctx.addIssue({
        code: 'custom',
        path: ['consentReference'],
        message: ADMIN_CATALOG_COPY.TESTIMONIALS.ERRORS.CONSENT_REQUIRED,
      });
    }
  }
}

export const createAdminTestimonialInputSchema =
  adminTestimonialBaseSchema.superRefine(validateTestimonialConsent);

export const updateAdminTestimonialInputSchema = adminTestimonialBaseSchema
  .extend({
    expectedUpdatedAt: z.string().min(1),
  })
  .superRefine(validateTestimonialConsent);
