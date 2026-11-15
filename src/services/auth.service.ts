import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { requestApi } from '@/lib/axios';
import type {
  LoginRequest,
  PasswordResetRequest,
  UpdatePasswordRequest,
} from '@/types/auth';
import {
  adminSessionResponseSchema,
  loginResponseSchema,
  logoutResponseSchema,
  passwordResetResponseSchema,
  updatePasswordResponseSchema,
} from '@/validations/auth.schema';

/** Admin authentication, password recovery, and session inspection service. */
export const authService = {
  login: (payload: LoginRequest, signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.AUTH_LOGIN,
        method: 'POST',
        data: payload,
        signal,
      },
      loginResponseSchema,
    ),

  logout: (signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.AUTH_LOGOUT,
        method: 'POST',
        data: {},
        signal,
      },
      logoutResponseSchema,
    ),

  requestPasswordReset: (payload: PasswordResetRequest, signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.AUTH_REQUEST_RESET,
        method: 'POST',
        data: payload,
        signal,
      },
      passwordResetResponseSchema,
    ),

  updatePassword: (payload: UpdatePasswordRequest, signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.AUTH_UPDATE_PASSWORD,
        method: 'POST',
        data: payload,
        signal,
      },
      updatePasswordResponseSchema,
    ),

  getSession: (signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_SESSION,
        method: 'GET',
        signal,
      },
      adminSessionResponseSchema,
    ),
};
