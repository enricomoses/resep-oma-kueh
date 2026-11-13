'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS, STALE_TIME } from '@/constants/query-keys.constant';
import { fetchPublicPromotions } from '@/services/promotion.service';

export function usePublicPromotions(
  branchCode: string | null = null,
  enabled = true,
) {
  return useQuery({
    queryKey: QUERY_KEYS.PROMOTIONS(branchCode),
    queryFn: ({ signal }) => fetchPublicPromotions(branchCode, signal),
    staleTime: STALE_TIME.PUBLIC,
    enabled,
  });
}
