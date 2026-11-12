import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { requestApi } from '@/lib/axios';
import {
  publicContentDirectorySchema,
  publicFaqDirectorySchema,
} from '@/validations/content.schema';
import type { PublicCmsKey } from '@/types/content';

export function readPublicContent(
  keys: readonly PublicCmsKey[],
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: API_ENDPOINTS.CONTENT,
      method: 'GET',
      params: keys.length > 0 ? { keys: keys.join(',') } : undefined,
      signal,
    },
    publicContentDirectorySchema,
  );
}

export function readPublicFaqs(signal?: AbortSignal) {
  return requestApi(
    {
      url: API_ENDPOINTS.FAQS,
      method: 'GET',
      signal,
    },
    publicFaqDirectorySchema,
  );
}
