'use client';

import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS, STALE_TIME } from '@/constants/query-keys.constant';
import { unwrapData } from '@/hooks/queries/query-helpers';
import { branchesService } from '@/services/branches.service';
import type { BranchInitial } from '@/types/branch';

type BranchDirectory = Extract<BranchInitial, { status: 'success' }>['data'];

/** Fetches public branch directory entries, optionally resolving a branch URL code. */
export function useBranchesQuery(
  code: string | null,
  initialData?: BranchDirectory,
) {
  return useQuery({
    queryKey: QUERY_KEYS.BRANCHES(code),
    queryFn: ({ signal }) => unwrapData(branchesService.getAll(code, signal)),
    staleTime: STALE_TIME.PUBLIC,
    initialData,
  });
}
