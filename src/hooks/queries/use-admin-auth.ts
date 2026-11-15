'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  QUERY_KEYS,
  STALE_TIME,
  toAdminQueryIdentity,
} from '@/constants/query-keys.constant';
import { invalidateQueryKeys, unwrapData } from '@/hooks/queries/query-helpers';
import { authService } from '@/services/auth.service';
import type {
  AdminSessionProfile,
  LoginRequest,
  PasswordResetRequest,
  UpdatePasswordRequest,
} from '@/types/auth';

/** Fetches the active admin session profile scoped strictly to identity. */
export function useAdminSession(initialProfile: AdminSessionProfile | null) {
  const identity = toAdminQueryIdentity(initialProfile);

  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_SESSION(identity),
    queryFn: async ({ signal }) => {
      const data = await unwrapData(authService.getSession(signal));
      return data.profile;
    },
    initialData: initialProfile ?? undefined,
    enabled: Boolean(initialProfile),
    staleTime: STALE_TIME.ADMIN_FRESH,
    gcTime: 0,
    retry: false,
  });
}

/** Authenticates an admin user and resets private admin query cache to the new identity. */
export function useAdminLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
    onSuccess: (response) => {
      // Clear any previous admin account's private cache before seeding new identity.
      queryClient.removeQueries({ queryKey: QUERY_KEYS.ADMIN_ROOT });
      const { profile } = response.data;
      queryClient.setQueryData(
        QUERY_KEYS.ADMIN_SESSION(toAdminQueryIdentity(profile)),
        profile,
      );
    },
  });
}

/** Ends the active admin session and purges all private admin query cache entries. */
export function useAdminLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.ADMIN_ROOT });
    },
  });
}

/** Requests an admin password reset link. */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (payload: PasswordResetRequest) =>
      authService.requestPasswordReset(payload),
  });
}

/** Updates an admin password and refreshes private admin session state. */
export function useUpdatePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePasswordRequest) =>
      authService.updatePassword(payload),
    onSuccess: () => invalidateQueryKeys(queryClient, [QUERY_KEYS.ADMIN_ROOT]),
  });
}
