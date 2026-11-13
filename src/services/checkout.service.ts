import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { requestApi } from '@/lib/axios';
import type { CheckoutPrepareRequest } from '@/types/checkout';
import { checkoutPrepareResponseSchema } from '@/validations/checkout.schema';

export function prepareCheckout(
  payload: CheckoutPrepareRequest,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: API_ENDPOINTS.CHECKOUT_PREPARE,
      method: 'POST',
      data: payload,
      signal,
    },
    checkoutPrepareResponseSchema,
  );
}
