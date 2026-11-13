'use client';

import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys.constant';
import {
  archiveAdminClassProgramRequest,
  archiveAdminClassSessionRequest,
  createAdminClassProgramRequest,
  createAdminClassSessionRequest,
  readAdminClassProgramsRequest,
  readAdminClassSessionsRequest,
  updateAdminClassProgramRequest,
  updateAdminClassSessionRequest,
} from '@/services/admin-classes.service';
import type { AdminSessionProfile } from '@/types/auth';
import type {
  AdminClassProgramsListData,
  AdminClassSessionsListData,
  CreateAdminClassProgramInput,
  CreateAdminClassSessionInput,
  UpdateAdminClassProgramInput,
  UpdateAdminClassSessionInput,
} from '@/types/classes';

const PUBLIC_CLASSES_PREFIX = ['resep-oma-kueh', 'classes'] as const;
const PUBLIC_CLASS_DETAIL_PREFIX = ['resep-oma-kueh', 'class-detail'] as const;
const PUBLIC_HOME_PREFIX = ['resep-oma-kueh', 'home'] as const;
const ADMIN_OVERVIEW_PREFIX = ['resep-oma-kueh', 'admin', 'overview'] as const;
const ADMIN_CLASS_PROGRAMS_PREFIX = [
  'resep-oma-kueh',
  'admin',
  'class-programs',
] as const;
const ADMIN_CLASS_SESSIONS_PREFIX = [
  'resep-oma-kueh',
  'admin',
  'class-sessions',
] as const;

function toIdentity(profile: AdminSessionProfile) {
  return {
    userId: profile.userId,
    role: profile.role,
    branchId: profile.branchId,
  };
}

async function invalidateClassScopes(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ADMIN_CLASS_PROGRAMS_PREFIX }),
    queryClient.invalidateQueries({ queryKey: ADMIN_CLASS_SESSIONS_PREFIX }),
    queryClient.invalidateQueries({ queryKey: ADMIN_OVERVIEW_PREFIX }),
    queryClient.invalidateQueries({ queryKey: PUBLIC_CLASSES_PREFIX }),
    queryClient.invalidateQueries({ queryKey: PUBLIC_CLASS_DETAIL_PREFIX }),
    queryClient.invalidateQueries({ queryKey: PUBLIC_HOME_PREFIX }),
  ]);
}

export function useAdminClassPrograms(
  profile: AdminSessionProfile,
  initialData?: AdminClassProgramsListData,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_CLASS_PROGRAMS(toIdentity(profile)),
    queryFn: async ({ signal }) => {
      const response = await readAdminClassProgramsRequest(signal);
      return response.data;
    },
    initialData,
    staleTime: 0,
    gcTime: 60_000,
    retry: false,
  });
}

export function useCreateAdminClassProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminClassProgramInput) =>
      createAdminClassProgramRequest(payload),
    onSuccess: () => invalidateClassScopes(queryClient),
  });
}

export function useUpdateAdminClassProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAdminClassProgramInput;
    }) => updateAdminClassProgramRequest(id, payload),
    onSuccess: () => invalidateClassScopes(queryClient),
  });
}

export function useArchiveAdminClassProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      expectedUpdatedAt,
    }: {
      id: string;
      expectedUpdatedAt: string;
    }) => archiveAdminClassProgramRequest(id, { expectedUpdatedAt }),
    onSuccess: () => invalidateClassScopes(queryClient),
  });
}

export function useAdminClassSessions(
  profile: AdminSessionProfile,
  params: { branchId?: string; programId?: string } = {},
  initialData?: AdminClassSessionsListData,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_CLASS_SESSIONS(toIdentity(profile), params),
    queryFn: async ({ signal }) => {
      const response = await readAdminClassSessionsRequest(params, signal);
      return response.data;
    },
    initialData:
      !params.branchId && !params.programId ? initialData : undefined,
    staleTime: 0,
    gcTime: 60_000,
    retry: false,
  });
}

export function useCreateAdminClassSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminClassSessionInput) =>
      createAdminClassSessionRequest(payload),
    onSuccess: () => invalidateClassScopes(queryClient),
  });
}

export function useUpdateAdminClassSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAdminClassSessionInput;
    }) => updateAdminClassSessionRequest(id, payload),
    onSuccess: () => invalidateClassScopes(queryClient),
  });
}

export function useArchiveAdminClassSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      expectedUpdatedAt,
    }: {
      id: string;
      expectedUpdatedAt: string;
    }) => archiveAdminClassSessionRequest(id, { expectedUpdatedAt }),
    onSuccess: () => invalidateClassScopes(queryClient),
  });
}
