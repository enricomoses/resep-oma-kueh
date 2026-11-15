'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  QUERY_KEYS,
  toAdminQueryIdentity,
} from '@/constants/query-keys.constant';
import {
  ADMIN_QUERY_DEFAULTS,
  invalidateQueryKeys,
  unwrapData,
} from '@/hooks/queries/query-helpers';
import { adminClassesService } from '@/services/admin-classes.service';
import type { AdminSessionProfile } from '@/types/auth';
import type {
  AdminClassProgramsListData,
  AdminClassSessionsListData,
  CreateAdminClassProgramInput,
  CreateAdminClassSessionInput,
  UpdateAdminClassProgramInput,
  UpdateAdminClassSessionInput,
} from '@/types/classes';

const CLASS_INVALIDATION_KEYS = [
  QUERY_KEYS.ADMIN_CLASS_PROGRAMS_ALL,
  QUERY_KEYS.ADMIN_CLASS_SESSIONS_ALL,
  QUERY_KEYS.ADMIN_OVERVIEW_ALL,
  QUERY_KEYS.CLASSES_ALL,
  QUERY_KEYS.CLASS_DETAIL_ALL,
  QUERY_KEYS.HOME_ALL,
] as const;

/** Fetches admin baking class programs. */
export function useAdminClassPrograms(
  profile: AdminSessionProfile,
  initialData?: AdminClassProgramsListData,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_CLASS_PROGRAMS(toAdminQueryIdentity(profile)),
    queryFn: ({ signal }) =>
      unwrapData(adminClassesService.getPrograms(signal)),
    initialData,
    ...ADMIN_QUERY_DEFAULTS,
  });
}

/** Creates a new baking class program and invalidates related admin and public caches. */
export function useCreateAdminClassProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminClassProgramInput) =>
      adminClassesService.createProgram(payload),
    onSuccess: () => invalidateQueryKeys(queryClient, CLASS_INVALIDATION_KEYS),
  });
}

/** Updates a baking class program and invalidates related admin and public caches. */
export function useUpdateAdminClassProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAdminClassProgramInput;
    }) => adminClassesService.updateProgram(id, payload),
    onSuccess: () => invalidateQueryKeys(queryClient, CLASS_INVALIDATION_KEYS),
  });
}

/** Archives a baking class program and invalidates related admin and public caches. */
export function useArchiveAdminClassProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      expectedUpdatedAt,
    }: {
      id: string;
      expectedUpdatedAt: string;
    }) => adminClassesService.archiveProgram(id, { expectedUpdatedAt }),
    onSuccess: () => invalidateQueryKeys(queryClient, CLASS_INVALIDATION_KEYS),
  });
}

/** Fetches filtered admin baking class sessions. */
export function useAdminClassSessions(
  profile: AdminSessionProfile,
  params: { branchId?: string; programId?: string } = {},
  initialData?: AdminClassSessionsListData,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_CLASS_SESSIONS(
      toAdminQueryIdentity(profile),
      params,
    ),
    queryFn: ({ signal }) =>
      unwrapData(adminClassesService.getSessions(params, signal)),
    initialData:
      !params.branchId && !params.programId ? initialData : undefined,
    ...ADMIN_QUERY_DEFAULTS,
  });
}

/** Creates a new baking class session and invalidates related admin and public caches. */
export function useCreateAdminClassSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminClassSessionInput) =>
      adminClassesService.createSession(payload),
    onSuccess: () => invalidateQueryKeys(queryClient, CLASS_INVALIDATION_KEYS),
  });
}

/** Updates a baking class session and invalidates related admin and public caches. */
export function useUpdateAdminClassSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAdminClassSessionInput;
    }) => adminClassesService.updateSession(id, payload),
    onSuccess: () => invalidateQueryKeys(queryClient, CLASS_INVALIDATION_KEYS),
  });
}

/** Archives a baking class session and invalidates related admin and public caches. */
export function useArchiveAdminClassSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      expectedUpdatedAt,
    }: {
      id: string;
      expectedUpdatedAt: string;
    }) => adminClassesService.archiveSession(id, { expectedUpdatedAt }),
    onSuccess: () => invalidateQueryKeys(queryClient, CLASS_INVALIDATION_KEYS),
  });
}
