'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { QUERY_KEYS, STALE_TIME } from '@/constants/query-keys.constant';
import { validateCart } from '@/services/cart.service';
import { useCartStore } from '@/stores/cart.store';
import type { AddLineInput, AddLineResult } from '@/stores/cart.store';
import type { CartValidatedLine } from '@/types/cart';

export function useCart() {
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const storageAvailable = useCartStore((state) => state.storageAvailable);
  const branchId = useCartStore((state) => state.branchId);
  const branchCode = useCartStore((state) => state.branchCode);
  const lines = useCartStore((state) => state.lines);

  const addLine = useCartStore((state) => state.addLine);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeLine = useCartStore((state) => state.removeLine);
  const clearCart = useCartStore((state) => state.clearCart);
  const setBranch = useCartStore((state) => state.setBranch);

  // Trigger hydration on mount
  useEffect(() => {
    if (!useCartStore.persist.hasHydrated()) {
      void useCartStore.persist.rehydrate();
    }
  }, []);

  const totalQuantity = useMemo(
    () => lines.reduce((sum, item) => sum + item.quantity, 0),
    [lines],
  );

  const distinctCount = lines.length;

  // Build stable signature for validation caching
  const linesSignature = useMemo(
    () =>
      lines
        .map(
          (l) =>
            `${l.id}:${l.quantity}:${l.choiceIds.slice().sort().join(',')}`,
        )
        .sort()
        .join('|'),
    [lines],
  );

  const queryItems = useMemo(
    () =>
      lines.map((line) => ({
        lineId: line.id,
        variantId: line.variantId,
        choiceIds: line.choiceIds,
        quantity: line.quantity,
      })),
    [lines],
  );

  const isValidationEnabled =
    hasHydrated && Boolean(branchId) && lines.length > 0;

  const validationQuery = useQuery({
    queryKey: QUERY_KEYS.CART_VALIDATE(branchId, linesSignature),
    queryFn: ({ signal }) =>
      validateCart(
        {
          branchId: branchId as string,
          items: queryItems,
        },
        signal,
      ),
    enabled: isValidationEnabled,
    staleTime: STALE_TIME.PUBLIC,
    refetchOnWindowFocus: true,
  });

  const validatedData = validationQuery.data?.data;
  const validatedLines: CartValidatedLine[] = validatedData?.lines ?? [];
  const estimatedSubtotalIdr = validatedData?.estimatedSubtotalIdr ?? 0;
  const totalDiscountIdr = validatedData?.totalDiscountIdr ?? 0;
  const estimatedTotalIdr = validatedData?.estimatedTotalIdr ?? 0;
  const hasBlockingConflicts = validatedData?.hasBlockingConflicts ?? false;
  const hasPriceChanges = validatedData?.hasPriceChanges ?? false;

  return {
    hasHydrated,
    storageAvailable,
    branchId,
    branchCode,
    lines,
    totalQuantity,
    distinctCount,
    addLine: (input: AddLineInput): AddLineResult => addLine(input),
    updateQuantity,
    removeLine,
    clearCart,
    setBranch,
    isValidationEnabled,
    isValidating: validationQuery.isLoading || validationQuery.isFetching,
    isValidationError: validationQuery.isError,
    validatedLines,
    estimatedSubtotalIdr,
    totalDiscountIdr,
    estimatedTotalIdr,
    hasBlockingConflicts,
    hasPriceChanges,
    refetchValidation: validationQuery.refetch,
  };
}
