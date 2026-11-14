import { z } from 'zod';

import {
  ADMIN_CATALOG_LIMITS,
  ADMIN_MEDIA_LIMITS,
} from '@/constants/admin-catalog.constant';
import {
  CLASS_PROGRAM_STATUSES,
  CLASS_SESSION_STATUSES,
  CLASSES_LIMITS,
} from '@/constants/classes.constant';
import { apiSuccessSchema } from '@/validations/api.schema';

const UNSAFE_MARKUP_REGEX =
  /<[/!A-Za-z]|<[^>]*>|javascript:|vbscript:|data:text\/html/i;

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function safeClassPlainText(minLen: number, maxLen: number) {
  return z
    .string()
    .trim()
    .min(minLen)
    .max(maxLen)
    .refine((val) => !UNSAFE_MARKUP_REGEX.test(val), {
      message: 'Teks tidak boleh mengandung tag HTML atau script.',
    });
}

const isoDatetimeUtcSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      const parsed = Date.parse(val);
      return Number.isFinite(parsed);
    },
    { message: 'Format waktu ISO UTC tidak valid.' },
  )
  .transform((val) => new Date(val).toISOString());

export const classProgramStatusSchema = z.enum(CLASS_PROGRAM_STATUSES);
export const classSessionStatusSchema = z.enum(CLASS_SESSION_STATUSES);

export const publicClassQuerySchema = z
  .object({
    branch: z.string().trim().toLowerCase().regex(slugRegex).max(64).optional(),
  })
  .strict();

export const classUnavailableReasonSchema = z.enum([
  'SESSION_CANCELLED',
  'SESSION_FULL',
  'REGISTRATION_CLOSED',
  'DEADLINE_PASSED',
  'SESSION_ENDED',
  'BRANCH_INACTIVE',
  'PROGRAM_UNAVAILABLE',
]);

const publicClassBranchSchema = z
  .object({
    id: z.uuid(),
    code: z.string().min(1),
    name: z.string().min(1),
    city: z.string().min(1),
    whatsappNumber: z.string().min(6).max(20),
    address: z.string().nullable(),
  })
  .strict();

export const publicClassSessionSchema = z
  .object({
    id: z.uuid(),
    programId: z.uuid(),
    branch: publicClassBranchSchema,
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
    registrationDeadlineAt: z.string().nullable(),
    capacity: z.number().int().positive(),
    seatsLeft: z.number().int().min(0).nullable(),
    capacityIsEstimate: z.literal(true),
    effectivePriceIdr: z.number().int().positive(),
    hasPriceOverride: z.boolean(),
    status: classSessionStatusSchema,
    isRegistrationOpen: z.boolean(),
    isRegisterable: z.boolean(),
    unavailableReason: classUnavailableReasonSchema.nullable(),
  })
  .strict();

export const publicClassProgramSummarySchema = z
  .object({
    id: z.uuid(),
    title: safeClassPlainText(1, 140),
    slug: z.string().regex(slugRegex).max(120),
    shortDescription: z.string().max(500).nullable(),
    description: z.string().min(1).max(4000),
    basePriceIdr: z.number().int().positive(),
    ageMin: z.number().int().min(0).max(120).nullable(),
    ageMax: z.number().int().min(0).max(120).nullable(),
    durationMinutes: z.number().int().positive().nullable(),
    coverImageUrl: z.url().nullable(),
    coverAltText: z.string().min(1).max(220),
    includedItems: z.array(z.string().max(160)).max(50),
    upcomingSessions: z.array(publicClassSessionSchema),
    registerableSessionCount: z.number().int().nonnegative(),
  })
  .strict();

export const publicClassesListDataSchema = z
  .object({
    items: z.array(publicClassProgramSummarySchema),
    resolvedBranchId: z.uuid().nullable(),
    evaluatedAtUtc: z.string().min(1),
  })
  .strict();

export const publicClassesListResponseSchema = apiSuccessSchema(
  publicClassesListDataSchema,
);

export const publicClassDetailDataSchema = z
  .object({
    program: publicClassProgramSummarySchema,
    resolvedBranchId: z.uuid().nullable(),
    evaluatedAtUtc: z.string().min(1),
  })
  .strict();

export const publicClassDetailResponseSchema = apiSuccessSchema(
  publicClassDetailDataSchema,
);

export const prepareClassRegistrationRequestSchema = z
  .object({
    sessionId: z.uuid(),
    attendeeCount: z
      .number()
      .int()
      .min(1)
      .max(CLASSES_LIMITS.MAX_ATTENDEES_PER_REGISTRATION),
    adultContactName: safeClassPlainText(
      1,
      CLASSES_LIMITS.MAX_ADULT_CONTACT_NAME_LENGTH,
    )
      .nullable()
      .optional(),
  })
  .strict();

export const prepareClassRegistrationDataSchema = z
  .object({
    sessionId: z.uuid(),
    programId: z.uuid(),
    programTitle: z.string().min(1),
    programSlug: z.string().min(1),
    branchId: z.uuid(),
    branchCode: z.string().min(1),
    branchName: z.string().min(1),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
    registrationDeadlineAt: z.string().nullable(),
    formattedScheduleJakarta: z.string().min(1),
    attendeeCount: z.number().int().positive(),
    unitPriceIdr: z.number().int().positive(),
    estimatedTotalIdr: z.number().int().positive(),
    capacity: z.number().int().positive(),
    seatsLeft: z.number().int().min(0).nullable(),
    capacityIsEstimate: z.literal(true),
    adultContactName: z.string().nullable(),
    whatsappNumber: z.string().min(6).max(20),
    whatsappUrl: z.url().startsWith('https://wa.me/'),
    whatsappMessage: z.string().min(1),
    requiresCopy: z.boolean(),
    manualConfirmationNote: z.string().min(1),
  })
  .strict();

export const prepareClassRegistrationResponseSchema = apiSuccessSchema(
  prepareClassRegistrationDataSchema,
);

const includedItemsArraySchema = z
  .array(safeClassPlainText(1, CLASSES_LIMITS.MAX_INCLUDED_ITEM_LENGTH))
  .max(CLASSES_LIMITS.MAX_INCLUDED_ITEMS);

export const adminClassProgramItemSchema = z
  .object({
    id: z.uuid(),
    title: z.string().min(1),
    slug: z.string().min(1),
    shortDescription: z.string().nullable(),
    description: z.string().nullable(),
    basePriceIdr: z.number().int().positive(),
    ageMin: z.number().int().nullable(),
    ageMax: z.number().int().nullable(),
    durationMinutes: z.number().int().nullable(),
    coverImagePath: z.string().nullable(),
    coverStorageBucket: z.enum(['media-drafts', 'class-images']),
    coverIsApproved: z.boolean(),
    coverAltText: z.string().nullable(),
    coverPreviewUrl: z.string().nullable(),
    needsOwnerReview: z.boolean(),
    includedItems: z.array(z.string()),
    status: classProgramStatusSchema,
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
  })
  .strict();

export const createAdminClassProgramInputSchema = z
  .object({
    title: safeClassPlainText(
      ADMIN_CATALOG_LIMITS.NAME_MIN,
      ADMIN_CATALOG_LIMITS.NAME_MAX,
    ),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(ADMIN_CATALOG_LIMITS.SLUG_MIN)
      .max(ADMIN_CATALOG_LIMITS.SLUG_MAX)
      .regex(
        slugRegex,
        'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.',
      ),
    shortDescription: safeClassPlainText(1, ADMIN_CATALOG_LIMITS.SHORT_DESC_MAX)
      .nullable()
      .optional(),
    description: safeClassPlainText(1, ADMIN_CATALOG_LIMITS.DESC_MAX)
      .nullable()
      .optional(),
    basePriceIdr: z
      .number()
      .int()
      .positive()
      .max(ADMIN_CATALOG_LIMITS.MAX_UNIT_PRICE_IDR),
    ageMin: z
      .number()
      .int()
      .min(CLASSES_LIMITS.MIN_AGE)
      .max(CLASSES_LIMITS.MAX_AGE)
      .nullable()
      .optional(),
    ageMax: z
      .number()
      .int()
      .min(CLASSES_LIMITS.MIN_AGE)
      .max(CLASSES_LIMITS.MAX_AGE)
      .nullable()
      .optional(),
    durationMinutes: z
      .number()
      .int()
      .positive()
      .max(CLASSES_LIMITS.MAX_DURATION_MINUTES)
      .nullable()
      .optional(),
    includedItems: includedItemsArraySchema.optional().default([]),
    draftCoverPath: z.string().trim().min(1).max(500).nullable().optional(),
    coverAltText: safeClassPlainText(
      ADMIN_MEDIA_LIMITS.ALT_TEXT_MIN,
      ADMIN_MEDIA_LIMITS.ALT_TEXT_MAX,
    )
      .nullable()
      .optional(),
    coverIsApproved: z.boolean().optional().default(false),
    needsOwnerReview: z.boolean().optional().default(true),
    status: classProgramStatusSchema.optional().default('draft'),
  })
  .strict()
  .refine(
    (data) =>
      data.ageMin == null || data.ageMax == null || data.ageMin <= data.ageMax,
    {
      message: 'Usia minimum tidak boleh melebihi usia maksimum.',
      path: ['ageMin'],
    },
  );

export const updateAdminClassProgramInputSchema = z
  .object({
    title: safeClassPlainText(
      ADMIN_CATALOG_LIMITS.NAME_MIN,
      ADMIN_CATALOG_LIMITS.NAME_MAX,
    ).optional(),
    shortDescription: safeClassPlainText(1, ADMIN_CATALOG_LIMITS.SHORT_DESC_MAX)
      .nullable()
      .optional(),
    description: safeClassPlainText(1, ADMIN_CATALOG_LIMITS.DESC_MAX)
      .nullable()
      .optional(),
    basePriceIdr: z
      .number()
      .int()
      .positive()
      .max(ADMIN_CATALOG_LIMITS.MAX_UNIT_PRICE_IDR)
      .optional(),
    ageMin: z
      .number()
      .int()
      .min(CLASSES_LIMITS.MIN_AGE)
      .max(CLASSES_LIMITS.MAX_AGE)
      .nullable()
      .optional(),
    ageMax: z
      .number()
      .int()
      .min(CLASSES_LIMITS.MIN_AGE)
      .max(CLASSES_LIMITS.MAX_AGE)
      .nullable()
      .optional(),
    durationMinutes: z
      .number()
      .int()
      .positive()
      .max(CLASSES_LIMITS.MAX_DURATION_MINUTES)
      .nullable()
      .optional(),
    includedItems: includedItemsArraySchema.optional(),
    draftCoverPath: z.string().trim().min(1).max(500).nullable().optional(),
    clearCover: z.boolean().optional(),
    coverAltText: safeClassPlainText(
      ADMIN_MEDIA_LIMITS.ALT_TEXT_MIN,
      ADMIN_MEDIA_LIMITS.ALT_TEXT_MAX,
    )
      .nullable()
      .optional(),
    coverIsApproved: z.boolean().optional(),
    needsOwnerReview: z.boolean().optional(),
    status: classProgramStatusSchema.optional(),
    expectedUpdatedAt: z.string().min(1),
  })
  .strict();

export const adminClassSessionItemSchema = z
  .object({
    id: z.uuid(),
    programId: z.uuid(),
    programTitle: z.string().min(1),
    programSlug: z.string().min(1),
    programStatus: classProgramStatusSchema,
    programBasePriceIdr: z.number().int().positive(),
    branchId: z.uuid(),
    branchCode: z.string().min(1),
    branchName: z.string().min(1),
    branchIsActive: z.boolean(),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
    registrationDeadlineAt: z.string().nullable(),
    capacity: z.number().int().positive(),
    seatsLeft: z.number().int().min(0).nullable(),
    priceOverrideIdr: z.number().int().positive().nullable(),
    effectivePriceIdr: z.number().int().positive(),
    status: classSessionStatusSchema,
    isRegistrationOpen: z.boolean(),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
  })
  .strict();

export const createAdminClassSessionInputSchema = z
  .object({
    programId: z.uuid(),
    branchId: z.uuid(),
    startsAt: isoDatetimeUtcSchema,
    endsAt: isoDatetimeUtcSchema,
    registrationDeadlineAt: isoDatetimeUtcSchema.nullable().optional(),
    capacity: z.number().int().positive().max(CLASSES_LIMITS.MAX_CAPACITY),
    seatsLeft: z
      .number()
      .int()
      .min(0)
      .max(CLASSES_LIMITS.MAX_CAPACITY)
      .nullable()
      .optional(),
    priceOverrideIdr: z
      .number()
      .int()
      .positive()
      .max(ADMIN_CATALOG_LIMITS.MAX_UNIT_PRICE_IDR)
      .nullable()
      .optional(),
    status: classSessionStatusSchema.optional().default('scheduled'),
    isRegistrationOpen: z.boolean().optional().default(false),
  })
  .strict();

export const updateAdminClassSessionInputSchema = z
  .object({
    startsAt: isoDatetimeUtcSchema.optional(),
    endsAt: isoDatetimeUtcSchema.optional(),
    registrationDeadlineAt: isoDatetimeUtcSchema.nullable().optional(),
    capacity: z
      .number()
      .int()
      .positive()
      .max(CLASSES_LIMITS.MAX_CAPACITY)
      .optional(),
    seatsLeft: z
      .number()
      .int()
      .min(0)
      .max(CLASSES_LIMITS.MAX_CAPACITY)
      .nullable()
      .optional(),
    priceOverrideIdr: z
      .number()
      .int()
      .positive()
      .max(ADMIN_CATALOG_LIMITS.MAX_UNIT_PRICE_IDR)
      .nullable()
      .optional(),
    status: classSessionStatusSchema.optional(),
    isRegistrationOpen: z.boolean().optional(),
    expectedUpdatedAt: z.string().min(1),
  })
  .strict();

export const adminClassArchiveInputSchema = z
  .object({
    expectedUpdatedAt: z.string().min(1),
  })
  .strict();

export const adminClassSessionsQuerySchema = z
  .object({
    branchId: z.uuid().optional(),
    programId: z.uuid().optional(),
  })
  .strict();

export const adminClassProgramsDataSchema = z
  .object({ items: z.array(adminClassProgramItemSchema) })
  .strict();

export const adminClassProgramMutationDataSchema = z
  .object({ item: adminClassProgramItemSchema })
  .strict();

export const adminClassSessionsDataSchema = z
  .object({ items: z.array(adminClassSessionItemSchema) })
  .strict();

export const adminClassSessionMutationDataSchema = z
  .object({ item: adminClassSessionItemSchema })
  .strict();

export const classRegistrationFormSchema = z.object({
  sessionId: z.uuid('Pilih sesi kelas yang tersedia.'),
  attendeeCount: z
    .number()
    .int()
    .min(1, 'Minimal 1 peserta.')
    .max(CLASSES_LIMITS.MAX_ATTENDEES_PER_REGISTRATION),
  adultContactName: z
    .string()
    .trim()
    .max(CLASSES_LIMITS.MAX_ADULT_CONTACT_NAME_LENGTH)
    .refine((val) => !UNSAFE_MARKUP_REGEX.test(val), {
      message: 'Nama kontak tidak boleh mengandung tag HTML atau script.',
    }),
  manualConfirmed: z.boolean().refine((val) => val === true, {
    message: 'Centang konfirmasi alur WhatsApp manual sebelum melanjutkan.',
  }),
});
