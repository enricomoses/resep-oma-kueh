'use client';

import { useMutation } from '@tanstack/react-query';

import { checkoutService } from '@/services/checkout.service';
import type { CheckoutPrepareRequest } from '@/types/checkout';

/** Prepares server-verified checkout quote and WhatsApp message envelope. */
export function useCheckoutPrepare() {
  return useMutation({
    mutationFn: (payload: CheckoutPrepareRequest) =>
      checkoutService.prepare(payload),
  });
}
