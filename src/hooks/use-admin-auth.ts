'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys.constant';
import {
  loginAdminRequest,
  logoutAdminRequest,
  readAdminSessionRequest,
  requestPasswordReset,
  updateAdminPasswordRequest,
} from '@/services/auth.service';
import type {
  AdminSessionProfile,
  LoginRequest,
  PasswordResetRequest,
  UpdatePasswordRequest,
} from '@/types/auth';

export function useAdminSession(initialProfile: AdminSessionProfile | null) {
  const identity = initialProfile
    ? {
        userId: initialProfile.userId,
        role: initialProfile.role,
        branchId: initialProfile.branchId,
      }
    : null;

  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_SESSION(identity),
    queryFn: async ({ signal }) => {
      const response = await readAdminSessionRequest(signal);
      return response.data.profile;
    },
    initialData: initialProfile ?? undefined,
    enabled: Boolean(initialProfile),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
}

export function useAdminLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginRequest) => loginAdminRequest(payload),
    onSuccess: (response) => {
      // Clear any previous admin account's private cache before seeding new identity.
      queryClient.removeQueries({ queryKey: QUERY_KEYS.ADMIN_ROOT });
      const { profile } = response.data;
      queryClient.setQueryData(
        QUERY_KEYS.ADMIN_SESSION({
          userId: profile.userId,
          role: profile.role,
          branchId: profile.branchId,
        }),
        profile,
      );
    },
  });
}

export function useAdminLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logoutAdminRequest(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.ADMIN_ROOT });
    },
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (payload: PasswordResetRequest) =>
      requestPasswordReset(payload),
  });
}

export function useUpdatePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePasswordRequest) =>
      updateAdminPasswordRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_ROOT });
    },
  });
}
