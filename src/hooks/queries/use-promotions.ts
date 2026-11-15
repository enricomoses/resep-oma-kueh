'use client';

import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS, STALE_TIME } from '@/constants/query-keys.constant';
import { unwrapData } from '@/hooks/queries/query-helpers';
import { promotionService } from '@/services/promotion.service';

/** Fetches active branch-scoped public promotions and shipping info banner. */
export function usePublicPromotions(
  branchCode: string | null = null,
  enabled = true,
) {
  return useQuery({
    queryKey: QUERY_KEYS.PROMOTIONS(branchCode),
    queryFn: ({ signal }) =>
      unwrapData(promotionService.getPublic(branchCode, signal)),
    staleTime: STALE_TIME.BRANCH_OFFERS,
    enabled,
  });
}
