import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { requestApi } from '@/lib/axios';
import {
  catalogDirectorySchema,
  productDetailSchema,
  publicCategoryDirectorySchema,
} from '@/validations/catalog.schema';
import type { CatalogQueryInput } from '@/types/catalog';

export function readCategories(signal?: AbortSignal) {
  return requestApi(
    {
      url: API_ENDPOINTS.CATEGORIES,
      method: 'GET',
      signal,
    },
    publicCategoryDirectorySchema,
  );
}

export function readCatalog(
  params: CatalogQueryInput = {},
  signal?: AbortSignal,
) {
  const cleanParams: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      cleanParams[key] = value as string | number;
    }
  }

  return requestApi(
    {
      url: API_ENDPOINTS.CATALOG,
      method: 'GET',
      params: Object.keys(cleanParams).length > 0 ? cleanParams : undefined,
      signal,
    },
    catalogDirectorySchema,
  );
}

export function readProductDetail(
  slug: string,
  branch?: string | null,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.PRODUCTS}/${encodeURIComponent(slug)}`,
      method: 'GET',
      params: branch ? { branch } : undefined,
      signal,
    },
    productDetailSchema,
  );
}
