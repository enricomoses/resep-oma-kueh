import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { requestApi } from '@/lib/axios';
import type { CatalogQueryInput } from '@/types/catalog';
import { buildListParams } from '@/utils/api';
import {
  catalogDirectorySchema,
  productDetailSchema,
  publicCategoryDirectorySchema,
} from '@/validations/catalog.schema';

/** Public menu category, catalog listing, and product detail service. */
export const catalogService = {
  getCategories: (signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.CATEGORIES,
        method: 'GET',
        signal,
      },
      publicCategoryDirectorySchema,
    ),

  getPaginated: (params: CatalogQueryInput = {}, signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.CATALOG,
        method: 'GET',
        params: buildListParams(params),
        signal,
      },
      catalogDirectorySchema,
    ),

  getBySlug: (slug: string, branch?: string | null, signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.PRODUCT_DETAIL(slug),
        method: 'GET',
        params: buildListParams({ branch }),
        signal,
      },
      productDetailSchema,
    ),
};
