import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { requestApi } from '@/lib/axios';
import type {
  AdminProductQuery,
  ArchiveAdminEntityInput,
  CreateAdminCategoryInput,
  CreateAdminProductInput,
  UpdateAdminCategoryInput,
  UpdateAdminProductInput,
} from '@/types/admin-catalog';
import {
  adminCategoryDetailResponseSchema,
  adminCategoryListResponseSchema,
  adminOverviewResponseSchema,
  adminProductDetailResponseSchema,
  adminProductListResponseSchema,
} from '@/validations/admin-catalog.schema';

export function readAdminOverviewRequest(signal?: AbortSignal) {
  return requestApi(
    {
      url: API_ENDPOINTS.ADMIN_OVERVIEW,
      method: 'GET',
      signal,
    },
    adminOverviewResponseSchema,
  );
}

export function readAdminCategoriesRequest(signal?: AbortSignal) {
  return requestApi(
    {
      url: API_ENDPOINTS.ADMIN_CATEGORIES,
      method: 'GET',
      signal,
    },
    adminCategoryListResponseSchema,
  );
}

export function createAdminCategoryRequest(
  payload: CreateAdminCategoryInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: API_ENDPOINTS.ADMIN_CATEGORIES,
      method: 'POST',
      data: payload,
      signal,
    },
    adminCategoryDetailResponseSchema,
  );
}

export function updateAdminCategoryRequest(
  id: string,
  payload: UpdateAdminCategoryInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.ADMIN_CATEGORIES}/${encodeURIComponent(id)}`,
      method: 'PATCH',
      data: payload,
      signal,
    },
    adminCategoryDetailResponseSchema,
  );
}

export function archiveAdminCategoryRequest(
  id: string,
  payload: ArchiveAdminEntityInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.ADMIN_CATEGORIES}/${encodeURIComponent(id)}`,
      method: 'DELETE',
      data: payload,
      signal,
    },
    adminCategoryDetailResponseSchema,
  );
}

export function readAdminProductsRequest(
  query: Partial<AdminProductQuery>,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: API_ENDPOINTS.ADMIN_PRODUCTS,
      method: 'GET',
      params: {
        q: query.q || undefined,
        status: query.status || undefined,
        categoryId: query.categoryId || undefined,
        page: query.page,
        limit: query.limit,
      },
      signal,
    },
    adminProductListResponseSchema,
  );
}

export function readAdminProductDetailRequest(
  id: string,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.ADMIN_PRODUCTS}/${encodeURIComponent(id)}`,
      method: 'GET',
      signal,
    },
    adminProductDetailResponseSchema,
  );
}

export function createAdminProductRequest(
  payload: CreateAdminProductInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: API_ENDPOINTS.ADMIN_PRODUCTS,
      method: 'POST',
      data: payload,
      signal,
    },
    adminProductDetailResponseSchema,
  );
}

export function updateAdminProductRequest(
  id: string,
  payload: UpdateAdminProductInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.ADMIN_PRODUCTS}/${encodeURIComponent(id)}`,
      method: 'PATCH',
      data: payload,
      signal,
    },
    adminProductDetailResponseSchema,
  );
}

export function archiveAdminProductRequest(
  id: string,
  payload: ArchiveAdminEntityInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.ADMIN_PRODUCTS}/${encodeURIComponent(id)}`,
      method: 'DELETE',
      data: payload,
      signal,
    },
    adminProductDetailResponseSchema,
  );
}
