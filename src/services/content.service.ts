import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { requestApi } from '@/lib/axios';
import type { PublicCmsKey } from '@/types/content';
import { buildListParams } from '@/utils/api';
import {
  publicContentDirectorySchema,
  publicFaqDirectorySchema,
} from '@/validations/content.schema';

/** Public CMS content entries and FAQ directory service. */
export const contentService = {
  getByKeys: (keys: readonly PublicCmsKey[], signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.CONTENT,
        method: 'GET',
        params: buildListParams({
          keys: keys.length > 0 ? keys.join(',') : undefined,
        }),
        signal,
      },
      publicContentDirectorySchema,
    ),

  getFaqs: (signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.FAQS,
        method: 'GET',
        signal,
      },
      publicFaqDirectorySchema,
    ),
};
