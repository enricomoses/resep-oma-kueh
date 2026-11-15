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
import type {
  SaveAdminPromotionInput,
  SaveAdminShippingBannerInput,
} from '@/types/promotion';
import { buildListParams } from '@/utils/api';
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
import {
  adminPromotionMutationResponseSchema,
  adminPromotionsListResponseSchema,
  adminShippingBannerMutationResponseSchema,
} from '@/validations/promotion.schema';

/** Admin overview, catalog, branches, availability, promotions, and media upload service. */
export const adminCatalogService = {
  getOverview: (signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_OVERVIEW,
        method: 'GET',
        signal,
      },
      adminOverviewResponseSchema,
    ),

  getCategories: (signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_CATEGORIES,
        method: 'GET',
        signal,
      },
      adminCategoryListResponseSchema,
    ),

  createCategory: (payload: CreateAdminCategoryInput, signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_CATEGORIES,
        method: 'POST',
        data: payload,
        signal,
      },
      adminCategoryDetailResponseSchema,
    ),

  updateCategory: (
    id: string,
    payload: UpdateAdminCategoryInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_CATEGORY_DETAIL(id),
        method: 'PATCH',
        data: payload,
        signal,
      },
      adminCategoryDetailResponseSchema,
    ),

  archiveCategory: (
    id: string,
    payload: ArchiveAdminEntityInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_CATEGORY_DETAIL(id),
        method: 'DELETE',
        data: payload,
        signal,
      },
      adminCategoryDetailResponseSchema,
    ),

  getProducts: (query: Partial<AdminProductQuery>, signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_PRODUCTS,
        method: 'GET',
        params: buildListParams({
          q: query.q,
          status: query.status,
          categoryId: query.categoryId,
          page: query.page,
          limit: query.limit,
        }),
        signal,
      },
      adminProductListResponseSchema,
    ),

  getProductDetail: (id: string, signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_PRODUCT_DETAIL(id),
        method: 'GET',
        signal,
      },
      adminProductDetailResponseSchema,
    ),

  createProduct: (payload: CreateAdminProductInput, signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_PRODUCTS,
        method: 'POST',
        data: payload,
        signal,
      },
      adminProductDetailResponseSchema,
    ),

  updateProduct: (
    id: string,
    payload: UpdateAdminProductInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_PRODUCT_DETAIL(id),
        method: 'PATCH',
        data: payload,
        signal,
      },
      adminProductDetailResponseSchema,
    ),

  archiveProduct: (
    id: string,
    payload: ArchiveAdminEntityInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_PRODUCT_DETAIL(id),
        method: 'DELETE',
        data: payload,
        signal,
      },
      adminProductDetailResponseSchema,
    ),

  getProductEditor: (id: string, signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_PRODUCT_DETAIL(id),
        method: 'GET',
        params: { include: 'editor' },
        signal,
      },
      adminProductDetailAggregateResponseSchema,
    ),

  saveProductConfiguration: (
    id: string,
    payload: SaveProductConfigurationInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_PRODUCT_CONFIGURATION(id),
        method: 'PUT',
        data: payload,
        signal,
      },
      adminSaveConfigurationResponseSchema,
    ),

  uploadMedia: (file: File, signal?: AbortSignal) => {
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
  },

  getBranches: (signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_BRANCHES,
        method: 'GET',
        signal,
      },
      adminBranchesResponseSchema,
    ),

  updateBranch: (
    branchId: string,
    payload: UpdateAdminBranchInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_BRANCH_DETAIL(branchId),
        method: 'PATCH',
        data: payload,
        signal,
      },
      adminBranchMutationResponseSchema,
    ),

  replaceBranchHours: (
    branchId: string,
    payload: ReplaceBranchHoursInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_BRANCH_HOURS(branchId),
        method: 'PUT',
        data: payload,
        signal,
      },
      adminBranchMutationResponseSchema,
    ),

  getAvailability: (
    params: Partial<AdminAvailabilityQuery>,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_AVAILABILITY,
        method: 'GET',
        params: buildListParams(params),
        signal,
      },
      adminAvailabilityListResponseSchema,
    ),

  upsertAvailability: (
    branchId: string,
    variantId: string,
    payload: UpsertBranchAvailabilityInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_AVAILABILITY_ITEM(branchId, variantId),
        method: 'PUT',
        data: payload,
        signal,
      },
      adminAvailabilityUpsertResponseSchema,
    ),

  bulkUpdateAvailability: (
    payload: BulkUpdateAvailabilityInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_AVAILABILITY_BULK,
        method: 'POST',
        data: payload,
        signal,
      },
      adminBulkAvailabilityResponseSchema,
    ),

  getPromotions: (signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_PROMOTIONS,
        method: 'GET',
        signal,
      },
      adminPromotionsListResponseSchema,
    ),

  createPromotion: (payload: SaveAdminPromotionInput, signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_PROMOTIONS,
        method: 'POST',
        data: payload,
        signal,
      },
      adminPromotionMutationResponseSchema,
    ),

  savePromotion: (
    promotionId: string,
    payload: SaveAdminPromotionInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_PROMOTION_DETAIL(promotionId),
        method: 'PATCH',
        data: payload,
        signal,
      },
      adminPromotionMutationResponseSchema,
    ),

  archivePromotion: (
    promotionId: string,
    payload: ArchiveAdminEntityInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_PROMOTION_DETAIL(promotionId),
        method: 'DELETE',
        data: payload,
        signal,
      },
      adminPromotionMutationResponseSchema,
    ),

  saveShippingBanner: (
    payload: SaveAdminShippingBannerInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.ADMIN_PROMOTIONS_SHIPPING_BANNER,
        method: 'PUT',
        data: payload,
        signal,
      },
      adminShippingBannerMutationResponseSchema,
    ),
};
