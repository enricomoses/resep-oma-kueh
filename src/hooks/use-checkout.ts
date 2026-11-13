'use client';

import { useMutation } from '@tanstack/react-query';
import { prepareCheckout } from '@/services/checkout.service';
import type { CheckoutPrepareRequest } from '@/types/checkout';

export function useCheckoutPrepare() {
  return useMutation({
    mutationFn: (payload: CheckoutPrepareRequest) => prepareCheckout(payload),
  });
}
