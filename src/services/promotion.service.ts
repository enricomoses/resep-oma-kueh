import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { requestApi } from '@/lib/axios';
import type { PublicPromotionsResponse } from '@/types/promotion';
import { publicPromotionsResponseSchema } from '@/validations/promotion.schema';

export async function fetchPublicPromotions(
  branchCode?: string | null,
  signal?: AbortSignal,
): Promise<PublicPromotionsResponse> {
  const envelope = await requestApi(
    {
      url: API_ENDPOINTS.PROMOTIONS,
      method: 'GET',
      params: branchCode ? { branch: branchCode } : undefined,
      signal,
    },
    publicPromotionsResponseSchema,
  );

  return envelope.data;
}
