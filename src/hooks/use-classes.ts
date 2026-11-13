'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import { QUERY_KEYS, STALE_TIME } from '@/constants/query-keys.constant';
import {
  prepareClassRegistrationRequest,
  readPublicClassDetailRequest,
  readPublicClassesRequest,
} from '@/services/classes.service';
import type {
  PrepareClassRegistrationInput,
  PublicClassProgram,
  PublicClassesListData,
} from '@/types/classes';

export function usePublicClasses(
  branchCode: string | null,
  initialData?: PublicClassesListData,
) {
  return useQuery({
    queryKey: QUERY_KEYS.CLASSES(branchCode),
    queryFn: async ({ signal }) => {
      const response = await readPublicClassesRequest(branchCode, signal);
      return response.data;
    },
    initialData,
    staleTime: STALE_TIME.PUBLIC,
  });
}

export function usePublicClassDetail(
  slug: string,
  branchCode: string | null,
  initialData?: {
    program: PublicClassProgram;
    resolvedBranchId: string | null;
    evaluatedAtUtc: string;
  },
) {
  return useQuery({
    queryKey: QUERY_KEYS.CLASS_DETAIL(slug, branchCode),
    queryFn: async ({ signal }) => {
      const response = await readPublicClassDetailRequest(
        slug,
        branchCode,
        signal,
      );
      return response.data;
    },
    initialData,
    staleTime: STALE_TIME.PUBLIC,
  });
}

export function usePrepareClassRegistration() {
  return useMutation({
    mutationFn: async (payload: PrepareClassRegistrationInput) => {
      const response = await prepareClassRegistrationRequest(payload);
      return response.data;
    },
  });
}
