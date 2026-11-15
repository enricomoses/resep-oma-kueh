import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { requestApi } from '@/lib/axios';
import { buildListParams } from '@/utils/api';
import { publicPromotionsResponseSchema } from '@/validations/promotion.schema';

/** Public promotions and shipping info banner service. */
export const promotionService = {
  getPublic: (branchCode?: string | null, signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.PROMOTIONS,
        method: 'GET',
        params: buildListParams({ branch: branchCode }),
        signal,
      },
      publicPromotionsResponseSchema,
    ),
};
