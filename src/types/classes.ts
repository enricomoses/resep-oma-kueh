import type { z } from 'zod';

import type {
  adminClassArchiveInputSchema,
  adminClassProgramItemSchema,
  adminClassProgramsDataSchema,
  adminClassSessionItemSchema,
  adminClassSessionsDataSchema,
  classProgramStatusSchema,
  classRegistrationFormSchema,
  classSessionStatusSchema,
  classUnavailableReasonSchema,
  createAdminClassProgramInputSchema,
  createAdminClassSessionInputSchema,
  prepareClassRegistrationDataSchema,
  prepareClassRegistrationRequestSchema,
  publicClassProgramSummarySchema,
  publicClassSessionSchema,
  publicClassesListDataSchema,
  updateAdminClassProgramInputSchema,
  updateAdminClassSessionInputSchema,
} from '@/validations/classes.schema';

export type ClassProgramStatus = z.infer<typeof classProgramStatusSchema>;
export type ClassSessionStatus = z.infer<typeof classSessionStatusSchema>;
export type ClassUnavailableReason = z.infer<
  typeof classUnavailableReasonSchema
>;

export type PublicClassSession = z.infer<typeof publicClassSessionSchema>;
export type PublicClassProgram = z.infer<
  typeof publicClassProgramSummarySchema
>;
export type PublicClassesListData = z.infer<typeof publicClassesListDataSchema>;
export type PrepareClassRegistrationInput = z.infer<
  typeof prepareClassRegistrationRequestSchema
>;
export type PrepareClassRegistrationResult = z.infer<
  typeof prepareClassRegistrationDataSchema
>;

export type AdminClassProgramItem = z.infer<typeof adminClassProgramItemSchema>;
export type AdminClassProgramsListData = z.infer<
  typeof adminClassProgramsDataSchema
>;
export type CreateAdminClassProgramInput = z.infer<
  typeof createAdminClassProgramInputSchema
>;
export type UpdateAdminClassProgramInput = z.infer<
  typeof updateAdminClassProgramInputSchema
>;

export type AdminClassSessionItem = z.infer<typeof adminClassSessionItemSchema>;
export type AdminClassSessionsListData = z.infer<
  typeof adminClassSessionsDataSchema
>;
export type CreateAdminClassSessionInput = z.infer<
  typeof createAdminClassSessionInputSchema
>;
export type UpdateAdminClassSessionInput = z.infer<
  typeof updateAdminClassSessionInputSchema
>;
export type AdminClassArchiveInput = z.infer<
  typeof adminClassArchiveInputSchema
>;

export interface AdminClassBranchOption {
  id: string;
  code: string;
  name: string;
  city: string;
  isActive: boolean;
}

export interface ProgramFormState {
  id: string | null;
  expectedUpdatedAt: string | null;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  basePriceIdr: string;
  ageMin: string;
  ageMax: string;
  durationMinutes: string;
  includedItemsText: string;
  draftCoverPath: string | null;
  clearCover: boolean;
  coverAltText: string;
  coverPreviewUrl: string | null;
  coverIsApproved: boolean;
  needsOwnerReview: boolean;
  status: ClassProgramStatus;
}

export interface SessionFormState {
  id: string | null;
  expectedUpdatedAt: string | null;
  programId: string;
  branchId: string;
  startsAtLocal: string;
  endsAtLocal: string;
  deadlineAtLocal: string;
  capacity: string;
  seatsLeft: string;
  priceOverrideIdr: string;
  status: ClassSessionStatus;
  isRegistrationOpen: boolean;
}

export type ConfirmActionState =
  | { kind: 'archive_program'; item: AdminClassProgramItem }
  | { kind: 'cancel_session'; item: AdminClassSessionItem }
  | null;

export type ClassRegistrationFormValues = z.infer<
  typeof classRegistrationFormSchema
>;
