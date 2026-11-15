import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { requestApi } from '@/lib/axios';
import type { CartValidationRequest } from '@/types/cart';
import { cartValidationResponseSchema } from '@/validations/cart.schema';

/** Public cart line validation service against active branch pricing and availability. */
export const cartService = {
  validate: (payload: CartValidationRequest, signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.CART_VALIDATE,
        method: 'POST',
        data: payload,
        signal,
      },
      cartValidationResponseSchema,
    ),
};
