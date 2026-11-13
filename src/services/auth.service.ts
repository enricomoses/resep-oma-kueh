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

export function loginAdminRequest(payload: LoginRequest, signal?: AbortSignal) {
  return requestApi(
    {
      url: API_ENDPOINTS.AUTH_LOGIN,
      method: 'POST',
      data: payload,
      signal,
    },
    loginResponseSchema,
  );
}

export function logoutAdminRequest(signal?: AbortSignal) {
  return requestApi(
    {
      url: API_ENDPOINTS.AUTH_LOGOUT,
      method: 'POST',
      data: {},
      signal,
    },
    logoutResponseSchema,
  );
}

export function requestPasswordReset(
  payload: PasswordResetRequest,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: API_ENDPOINTS.AUTH_REQUEST_RESET,
      method: 'POST',
      data: payload,
      signal,
    },
    passwordResetResponseSchema,
  );
}

export function updateAdminPasswordRequest(
  payload: UpdatePasswordRequest,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: API_ENDPOINTS.AUTH_UPDATE_PASSWORD,
      method: 'POST',
      data: payload,
      signal,
    },
    updatePasswordResponseSchema,
  );
}

export function readAdminSessionRequest(signal?: AbortSignal) {
  return requestApi(
    {
      url: API_ENDPOINTS.ADMIN_SESSION,
      method: 'GET',
      signal,
    },
    adminSessionResponseSchema,
  );
}
