import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { requestApi } from '@/lib/axios';
import type {
  AdminClassArchiveInput,
  CreateAdminClassProgramInput,
  CreateAdminClassSessionInput,
  UpdateAdminClassProgramInput,
  UpdateAdminClassSessionInput,
} from '@/types/classes';
import {
  adminClassProgramMutationDataSchema,
  adminClassProgramsDataSchema,
  adminClassSessionMutationDataSchema,
  adminClassSessionsDataSchema,
} from '@/validations/classes.schema';

export function readAdminClassProgramsRequest(signal?: AbortSignal) {
  return requestApi(
    {
      url: API_ENDPOINTS.ADMIN_CLASS_PROGRAMS,
      method: 'GET',
      signal,
    },
    adminClassProgramsDataSchema,
  );
}

export function createAdminClassProgramRequest(
  payload: CreateAdminClassProgramInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: API_ENDPOINTS.ADMIN_CLASS_PROGRAMS,
      method: 'POST',
      data: payload,
      signal,
    },
    adminClassProgramMutationDataSchema,
  );
}

export function updateAdminClassProgramRequest(
  id: string,
  payload: UpdateAdminClassProgramInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.ADMIN_CLASS_PROGRAMS}/${encodeURIComponent(id)}`,
      method: 'PATCH',
      data: payload,
      signal,
    },
    adminClassProgramMutationDataSchema,
  );
}

export function archiveAdminClassProgramRequest(
  id: string,
  payload: AdminClassArchiveInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.ADMIN_CLASS_PROGRAMS}/${encodeURIComponent(id)}`,
      method: 'DELETE',
      data: payload,
      signal,
    },
    adminClassProgramMutationDataSchema,
  );
}

export function readAdminClassSessionsRequest(
  params: { branchId?: string; programId?: string } = {},
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: API_ENDPOINTS.ADMIN_CLASS_SESSIONS,
      method: 'GET',
      params: {
        ...(params.branchId ? { branchId: params.branchId } : {}),
        ...(params.programId ? { programId: params.programId } : {}),
      },
      signal,
    },
    adminClassSessionsDataSchema,
  );
}

export function createAdminClassSessionRequest(
  payload: CreateAdminClassSessionInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: API_ENDPOINTS.ADMIN_CLASS_SESSIONS,
      method: 'POST',
      data: payload,
      signal,
    },
    adminClassSessionMutationDataSchema,
  );
}

export function updateAdminClassSessionRequest(
  id: string,
  payload: UpdateAdminClassSessionInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.ADMIN_CLASS_SESSIONS}/${encodeURIComponent(id)}`,
      method: 'PATCH',
      data: payload,
      signal,
    },
    adminClassSessionMutationDataSchema,
  );
}

export function archiveAdminClassSessionRequest(
  id: string,
  payload: AdminClassArchiveInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.ADMIN_CLASS_SESSIONS}/${encodeURIComponent(id)}`,
      method: 'DELETE',
      data: payload,
      signal,
    },
    adminClassSessionMutationDataSchema,
  );
}
