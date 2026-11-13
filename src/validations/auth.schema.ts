import { z } from 'zod';

import {
  ADMIN_ROLES,
  AUTH_COPY,
  AUTH_ERROR_REASONS,
  AUTH_LIMITS,
} from '@/constants/auth.constant';

export const adminRoleSchema = z.enum(ADMIN_ROLES);

export const authErrorReasonSchema = z.enum(AUTH_ERROR_REASONS);

const normalizedEmailSchema = z
  .string()
  .trim()
  .min(1, AUTH_COPY.VALIDATION.EMAIL_REQUIRED)
  .max(AUTH_LIMITS.EMAIL_MAX_LENGTH, AUTH_COPY.VALIDATION.EMAIL_INVALID)
  .pipe(z.email(AUTH_COPY.VALIDATION.EMAIL_INVALID))
  .transform((value) => value.toLowerCase());

export const loginRequestSchema = z.strictObject({
  email: normalizedEmailSchema,
  password: z
    .string()
    .min(1, AUTH_COPY.VALIDATION.PASSWORD_REQUIRED)
    .max(AUTH_LIMITS.PASSWORD_MAX_LENGTH, AUTH_COPY.VALIDATION.PASSWORD_MAX),
  next: z.string().max(512).nullable().optional(),
});

export const passwordResetRequestSchema = z.strictObject({
  email: normalizedEmailSchema,
});

export const updatePasswordRequestSchema = z.strictObject({
  password: z
    .string()
    .min(AUTH_LIMITS.PASSWORD_MIN_LENGTH, AUTH_COPY.VALIDATION.PASSWORD_MIN)
    .max(AUTH_LIMITS.PASSWORD_MAX_LENGTH, AUTH_COPY.VALIDATION.PASSWORD_MAX),
});

export const updatePasswordFormSchema = z
  .strictObject({
    password: z
      .string()
      .min(AUTH_LIMITS.PASSWORD_MIN_LENGTH, AUTH_COPY.VALIDATION.PASSWORD_MIN)
      .max(AUTH_LIMITS.PASSWORD_MAX_LENGTH, AUTH_COPY.VALIDATION.PASSWORD_MAX),
    confirmPassword: z
      .string()
      .min(1, AUTH_COPY.VALIDATION.PASSWORD_REQUIRED)
      .max(AUTH_LIMITS.PASSWORD_MAX_LENGTH, AUTH_COPY.VALIDATION.PASSWORD_MAX),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: AUTH_COPY.VALIDATION.PASSWORD_MISMATCH,
  });

export const adminSessionProfileSchema = z.strictObject({
  userId: z.string().uuid(),
  email: z.string().email().nullable(),
  displayName: z.string().trim().min(1).max(200),
  role: adminRoleSchema,
  branchId: z.string().uuid().nullable(),
  branchCode: z.enum(['surabaya', 'bintaro']).nullable(),
  branchName: z.string().nullable(),
});

export const loginResponseSchema = z.strictObject({
  profile: adminSessionProfileSchema,
  redirectTo: z.string().min(1),
});

export const logoutResponseSchema = z.strictObject({
  loggedOut: z.literal(true),
});

export const passwordResetResponseSchema = z.strictObject({
  accepted: z.literal(true),
  message: z.string().min(1),
});

export const updatePasswordResponseSchema = z.strictObject({
  updated: z.literal(true),
  redirectTo: z.string().min(1),
});

export const adminSessionResponseSchema = z.strictObject({
  profile: adminSessionProfileSchema,
});
