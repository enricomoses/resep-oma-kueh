import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { requestApi } from '@/lib/axios';
import type {
  AdminAvailabilityQuery,
  AdminProductQuery,
  ArchiveAdminEntityInput,
  BulkUpdateAvailabilityInput,
  CreateAdminCategoryInput,
  CreateAdminProductInput,
  ReplaceBranchHoursInput,
  SaveProductConfigurationInput,
  UpdateAdminBranchInput,
  UpdateAdminCategoryInput,
  UpdateAdminProductInput,
  UpsertBranchAvailabilityInput,
} from '@/types/admin-catalog';
import {
  adminAvailabilityListResponseSchema,
  adminAvailabilityUpsertResponseSchema,
  adminBranchMutationResponseSchema,
  adminBranchesResponseSchema,
  adminBulkAvailabilityResponseSchema,
  adminCategoryDetailResponseSchema,
  adminCategoryListResponseSchema,
  adminMediaUploadResponseSchema,
  adminOverviewResponseSchema,
  adminProductDetailAggregateResponseSchema,
  adminProductDetailResponseSchema,
  adminProductListResponseSchema,
  adminSaveConfigurationResponseSchema,
} from '@/validations/admin-catalog.schema';

import type {
  SaveAdminPromotionInput,
  SaveAdminShippingBannerInput,
} from '@/types/promotion';
import {
  adminPromotionMutationResponseSchema,
  adminPromotionsListResponseSchema,
  adminShippingBannerMutationResponseSchema,
} from '@/validations/promotion.schema';

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

export function readAdminProductEditorRequest(
  id: string,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.ADMIN_PRODUCTS}/${encodeURIComponent(id)}`,
      method: 'GET',
      params: { include: 'editor' },
      signal,
    },
    adminProductDetailAggregateResponseSchema,
  );
}

export function saveAdminProductConfigurationRequest(
  id: string,
  payload: SaveProductConfigurationInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.ADMIN_PRODUCTS}/${encodeURIComponent(id)}/configuration`,
      method: 'PUT',
      data: payload,
      signal,
    },
    adminSaveConfigurationResponseSchema,
  );
}

export function uploadAdminProductMediaRequest(
  file: File,
  signal?: AbortSignal,
) {
  const formData = new FormData();
  formData.append('file', file);
  return requestApi(
    {
      url: API_ENDPOINTS.ADMIN_MEDIA_UPLOAD,
      method: 'POST',
      data: formData,
      signal,
    },
    adminMediaUploadResponseSchema,
  );
}

export function readAdminBranchesRequest(signal?: AbortSignal) {
  return requestApi(
    {
      url: API_ENDPOINTS.ADMIN_BRANCHES,
      method: 'GET',
      signal,
    },
    adminBranchesResponseSchema,
  );
}

export function updateAdminBranchRequest(
  branchId: string,
  payload: UpdateAdminBranchInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.ADMIN_BRANCHES}/${encodeURIComponent(branchId)}`,
      method: 'PATCH',
      data: payload,
      signal,
    },
    adminBranchMutationResponseSchema,
  );
}

export function replaceAdminBranchHoursRequest(
  branchId: string,
  payload: ReplaceBranchHoursInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.ADMIN_BRANCHES}/${encodeURIComponent(branchId)}/hours`,
      method: 'PUT',
      data: payload,
      signal,
    },
    adminBranchMutationResponseSchema,
  );
}

export function readAdminAvailabilityRequest(
  params: Partial<AdminAvailabilityQuery>,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: API_ENDPOINTS.ADMIN_AVAILABILITY,
      method: 'GET',
      params,
      signal,
    },
    adminAvailabilityListResponseSchema,
  );
}

export function upsertAdminAvailabilityRequest(
  branchId: string,
  variantId: string,
  payload: UpsertBranchAvailabilityInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.ADMIN_AVAILABILITY}/${encodeURIComponent(branchId)}/${encodeURIComponent(variantId)}`,
      method: 'PUT',
      data: payload,
      signal,
    },
    adminAvailabilityUpsertResponseSchema,
  );
}

export function bulkUpdateAdminAvailabilityRequest(
  payload: BulkUpdateAvailabilityInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.ADMIN_AVAILABILITY}/bulk`,
      method: 'POST',
      data: payload,
      signal,
    },
    adminBulkAvailabilityResponseSchema,
  );
}

export function readAdminPromotionsRequest(signal?: AbortSignal) {
  return requestApi(
    {
      url: API_ENDPOINTS.ADMIN_PROMOTIONS,
      method: 'GET',
      signal,
    },
    adminPromotionsListResponseSchema,
  );
}

export function createAdminPromotionRequest(
  payload: SaveAdminPromotionInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: API_ENDPOINTS.ADMIN_PROMOTIONS,
      method: 'POST',
      data: payload,
      signal,
    },
    adminPromotionMutationResponseSchema,
  );
}

export function saveAdminPromotionRequest(
  promotionId: string,
  payload: SaveAdminPromotionInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.ADMIN_PROMOTIONS}/${encodeURIComponent(promotionId)}`,
      method: 'PATCH',
      data: payload,
      signal,
    },
    adminPromotionMutationResponseSchema,
  );
}

export function archiveAdminPromotionRequest(
  promotionId: string,
  payload: ArchiveAdminEntityInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.ADMIN_PROMOTIONS}/${encodeURIComponent(promotionId)}`,
      method: 'DELETE',
      data: payload,
      signal,
    },
    adminPromotionMutationResponseSchema,
  );
}

export function saveAdminShippingBannerRequest(
  payload: SaveAdminShippingBannerInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: API_ENDPOINTS.ADMIN_PROMOTIONS_SHIPPING_BANNER,
      method: 'PUT',
      data: payload,
      signal,
    },
    adminShippingBannerMutationResponseSchema,
  );
}
