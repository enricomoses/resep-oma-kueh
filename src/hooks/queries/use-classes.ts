'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import { QUERY_KEYS, STALE_TIME } from '@/constants/query-keys.constant';
import { unwrapData } from '@/hooks/queries/query-helpers';
import { classesService } from '@/services/classes.service';
import type {
  PrepareClassRegistrationInput,
  PublicClassProgram,
  PublicClassesListData,
} from '@/types/classes';

/** Fetches published baking class programs for the optional branch context. */
export function usePublicClasses(
  branchCode: string | null,
  initialData?: PublicClassesListData,
) {
  return useQuery({
    queryKey: QUERY_KEYS.CLASSES(branchCode),
    queryFn: ({ signal }) =>
      unwrapData(classesService.getAll(branchCode, signal)),
    initialData,
    staleTime: STALE_TIME.PUBLIC,
  });
}

/** Fetches a single baking class program detail with branch-aware schedules. */
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
    queryFn: ({ signal }) =>
      unwrapData(classesService.getBySlug(slug, branchCode, signal)),
    initialData,
    staleTime: STALE_TIME.PUBLIC,
  });
}

/** Prepares an unpersisted WhatsApp registration handoff payload for a class session. */
export function usePrepareClassRegistration() {
  return useMutation({
    mutationFn: (payload: PrepareClassRegistrationInput) =>
      unwrapData(classesService.prepareRegistration(payload)),
  });
}
