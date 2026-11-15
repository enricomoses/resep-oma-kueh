import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { requestApi } from '@/lib/axios';
import type { CheckoutPrepareRequest } from '@/types/checkout';
import { checkoutPrepareResponseSchema } from '@/validations/checkout.schema';

/** Public checkout quote verification and WhatsApp handoff preparation service. */
export const checkoutService = {
  prepare: (payload: CheckoutPrepareRequest, signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.CHECKOUT_PREPARE,
        method: 'POST',
        data: payload,
        signal,
      },
      checkoutPrepareResponseSchema,
    ),
};
