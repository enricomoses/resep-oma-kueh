import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { requestApi } from '@/lib/axios';
import { cartValidationResponseSchema } from '@/validations/cart.schema';
import type { CartValidationRequest } from '@/types/cart';

export function validateCart(
  payload: CartValidationRequest,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: API_ENDPOINTS.CART_VALIDATE,
      method: 'POST',
      data: payload,
      signal,
    },
    cartValidationResponseSchema,
  );
}
