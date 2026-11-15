'use client';

import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS, STALE_TIME } from '@/constants/query-keys.constant';
import { unwrapData } from '@/hooks/queries/query-helpers';
import { cartService } from '@/services/cart.service';
import type { CartValidationRequest } from '@/types/cart';

interface UseCartValidationQueryOptions {
  branchId: string | null;
  signature: string;
  items: CartValidationRequest['items'];
  enabled: boolean;
}

/** Validates local cart line items against live branch pricing and availability. */
export function useCartValidationQuery({
  branchId,
  signature,
  items,
  enabled,
}: UseCartValidationQueryOptions) {
  return useQuery({
    queryKey: QUERY_KEYS.CART_VALIDATE(branchId, signature),
    queryFn: ({ signal }) =>
      unwrapData(
        cartService.validate(
          {
            branchId: branchId as string,
            items,
          },
          signal,
        ),
      ),
    enabled,
    staleTime: STALE_TIME.BRANCH_OFFERS,
    refetchOnWindowFocus: true,
  });
}
