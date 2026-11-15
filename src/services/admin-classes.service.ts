import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { requestApi } from '@/lib/axios';
import type {
  AdminClassArchiveInput,
  CreateAdminClassProgramInput,
  CreateAdminClassSessionInput,
  UpdateAdminClassProgramInput,
  UpdateAdminClassSessionInput,
} from '@/types/classes';
import { buildListParams } from '@/utils/api';
import {
  adminClassProgramMutationDataSchema,
  adminClassProgramsDataSchema,
  adminClassSessionMutationDataSchema,
  adminClassSessionsDataSchema,
} from '@/validations/classes.schema';

/** Admin baking class programs and sessions CRUD service. */
export const adminClassesService = {
  getPrograms: (signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_CLASS_PROGRAMS,
        method: 'GET',
        signal,
      },
      adminClassProgramsDataSchema,
    ),

  createProgram: (
    payload: CreateAdminClassProgramInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_CLASS_PROGRAMS,
        method: 'POST',
        data: payload,
        signal,
      },
      adminClassProgramMutationDataSchema,
    ),

  updateProgram: (
    id: string,
    payload: UpdateAdminClassProgramInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_CLASS_PROGRAM_DETAIL(id),
        method: 'PATCH',
        data: payload,
        signal,
      },
      adminClassProgramMutationDataSchema,
    ),

  archiveProgram: (
    id: string,
    payload: AdminClassArchiveInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_CLASS_PROGRAM_DETAIL(id),
        method: 'DELETE',
        data: payload,
        signal,
      },
      adminClassProgramMutationDataSchema,
    ),

  getSessions: (
    params: { branchId?: string; programId?: string } = {},
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_CLASS_SESSIONS,
        method: 'GET',
        params: buildListParams(params),
        signal,
      },
      adminClassSessionsDataSchema,
    ),

  createSession: (
    payload: CreateAdminClassSessionInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_CLASS_SESSIONS,
        method: 'POST',
        data: payload,
        signal,
      },
      adminClassSessionMutationDataSchema,
    ),

  updateSession: (
    id: string,
    payload: UpdateAdminClassSessionInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_CLASS_SESSION_DETAIL(id),
        method: 'PATCH',
        data: payload,
        signal,
      },
      adminClassSessionMutationDataSchema,
    ),

  archiveSession: (
    id: string,
    payload: AdminClassArchiveInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_CLASS_SESSION_DETAIL(id),
        method: 'DELETE',
        data: payload,
        signal,
      },
      adminClassSessionMutationDataSchema,
    ),
};
