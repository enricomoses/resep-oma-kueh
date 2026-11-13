import type { z } from 'zod';

import type {
  adminRoleSchema,
  adminSessionProfileSchema,
  authErrorReasonSchema,
  loginRequestSchema,
  loginResponseSchema,
  passwordResetRequestSchema,
  passwordResetResponseSchema,
  updatePasswordFormSchema,
  updatePasswordRequestSchema,
  updatePasswordResponseSchema,
} from '@/validations/auth.schema';

export type AdminRole = z.infer<typeof adminRoleSchema>;
export type AuthErrorReason = z.infer<typeof authErrorReasonSchema>;
export type AdminSessionProfile = z.infer<typeof adminSessionProfileSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetResponse = z.infer<typeof passwordResetResponseSchema>;
export type UpdatePasswordRequest = z.infer<typeof updatePasswordRequestSchema>;
export type UpdatePasswordFormValues = z.infer<typeof updatePasswordFormSchema>;
export type UpdatePasswordResponse = z.infer<
  typeof updatePasswordResponseSchema
>;
