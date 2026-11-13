'use client';

import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys.constant';
import {
  archiveAdminCategoryRequest,
  archiveAdminProductRequest,
  bulkUpdateAdminAvailabilityRequest,
  createAdminCategoryRequest,
  createAdminProductRequest,
  readAdminAvailabilityRequest,
  readAdminBranchesRequest,
  readAdminCategoriesRequest,
  readAdminOverviewRequest,
  readAdminProductDetailRequest,
  readAdminProductEditorRequest,
  readAdminProductsRequest,
  readAdminPromotionsRequest,
  replaceAdminBranchHoursRequest,
  saveAdminProductConfigurationRequest,
  saveAdminPromotionRequest,
  saveAdminShippingBannerRequest,
  archiveAdminPromotionRequest,
  createAdminPromotionRequest,
  updateAdminBranchRequest,
  updateAdminCategoryRequest,
  updateAdminProductRequest,
  uploadAdminProductMediaRequest,
  upsertAdminAvailabilityRequest,
} from '@/services/admin-catalog.service';
import type {
  AdminAvailabilityListResponse,
  AdminAvailabilityQuery,
  AdminBranchesResponse,
  AdminCategoryListResponse,
  AdminOverviewResponse,
  AdminProductEditorAggregate,
  AdminProductListResponse,
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
import type { AdminSessionProfile } from '@/types/auth';
import type {
  AdminPromotionsListResponse,
  SaveAdminPromotionInput,
  SaveAdminShippingBannerInput,
} from '@/types/promotion';

const PUBLIC_BRANCHES_PREFIX = ['resep-oma-kueh', 'branches'] as const;
const PUBLIC_CATALOG_PREFIX = ['resep-oma-kueh', 'catalog'] as const;
const PUBLIC_PRODUCT_DETAIL_PREFIX = [
  'resep-oma-kueh',
  'product-detail',
] as const;
const PUBLIC_PROMOTIONS_PREFIX = ['resep-oma-kueh', 'promotions'] as const;
const PUBLIC_CONTENT_PREFIX = ['resep-oma-kueh', 'content'] as const;
const PUBLIC_CART_VALIDATE_PREFIX = [
  'resep-oma-kueh',
  'cart-validate',
] as const;

function toIdentity(profile: AdminSessionProfile) {
  return {
    userId: profile.userId,
    role: profile.role,
    branchId: profile.branchId,
  };
}

function invalidateCatalogScopes(queryClient: QueryClient) {
  void Promise.all([
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_ROOT }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES }),
    queryClient.invalidateQueries({ queryKey: PUBLIC_CATALOG_PREFIX }),
    queryClient.invalidateQueries({ queryKey: PUBLIC_PRODUCT_DETAIL_PREFIX }),
    queryClient.invalidateQueries({ queryKey: PUBLIC_PROMOTIONS_PREFIX }),
  ]).catch(() => undefined);
}

function invalidateBranchOfferScopes(queryClient: QueryClient) {
  void Promise.all([
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_ROOT }),
    queryClient.invalidateQueries({ queryKey: PUBLIC_BRANCHES_PREFIX }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES }),
    queryClient.invalidateQueries({ queryKey: PUBLIC_CATALOG_PREFIX }),
    queryClient.invalidateQueries({ queryKey: PUBLIC_PRODUCT_DETAIL_PREFIX }),
    queryClient.invalidateQueries({ queryKey: PUBLIC_PROMOTIONS_PREFIX }),
    queryClient.invalidateQueries({ queryKey: PUBLIC_CONTENT_PREFIX }),
    queryClient.invalidateQueries({ queryKey: PUBLIC_CART_VALIDATE_PREFIX }),
  ]).catch(() => undefined);
}

function invalidatePromotionScopes(queryClient: QueryClient) {
  invalidateBranchOfferScopes(queryClient);
}

export function useAdminOverview(
  profile: AdminSessionProfile,
  initialData?: AdminOverviewResponse,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_OVERVIEW(toIdentity(profile)),
    queryFn: async ({ signal }) => {
      const response = await readAdminOverviewRequest(signal);
      return response.data;
    },
    initialData,
    staleTime: 0,
    gcTime: 60_000,
    retry: false,
  });
}

export function useAdminCategories(
  profile: AdminSessionProfile,
  initialData?: AdminCategoryListResponse,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_CATEGORIES(toIdentity(profile)),
    queryFn: async ({ signal }) => {
      const response = await readAdminCategoriesRequest(signal);
      return response.data;
    },
    initialData,
    enabled: profile.role === 'owner',
    staleTime: 0,
    gcTime: 60_000,
    retry: false,
  });
}

export function useCreateAdminCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminCategoryInput) =>
      createAdminCategoryRequest(payload),
    onSuccess: () => invalidateCatalogScopes(queryClient),
  });
}

export function useUpdateAdminCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAdminCategoryInput;
    }) => updateAdminCategoryRequest(id, payload),
    onSuccess: () => invalidateCatalogScopes(queryClient),
  });
}

export function useArchiveAdminCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ArchiveAdminEntityInput;
    }) => archiveAdminCategoryRequest(id, payload),
    onSuccess: () => invalidateCatalogScopes(queryClient),
  });
}

export function useAdminProducts(
  profile: AdminSessionProfile,
  query: AdminProductQuery,
  initialData?: AdminProductListResponse,
) {
  const paramsKey: Record<string, string | number | null | undefined> = {
    q: query.q ?? '',
    status: query.status ?? 'all',
    categoryId: query.categoryId ?? 'all',
    page: query.page,
    limit: query.limit,
  };

  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_PRODUCTS(toIdentity(profile), paramsKey),
    queryFn: async ({ signal }) => {
      const response = await readAdminProductsRequest(query, signal);
      return response.data;
    },
    initialData,
    enabled: profile.role === 'owner',
    staleTime: 0,
    gcTime: 60_000,
    retry: false,
  });
}

export function useAdminProductDetail(
  profile: AdminSessionProfile,
  productId: string | null,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_PRODUCT_DETAIL(
      toIdentity(profile),
      productId ?? 'none',
    ),
    queryFn: async ({ signal }) => {
      const response = await readAdminProductDetailRequest(
        productId as string,
        signal,
      );
      return response.data.product;
    },
    enabled: profile.role === 'owner' && Boolean(productId),
    staleTime: 0,
    gcTime: 60_000,
    retry: false,
  });
}

export function useCreateAdminProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminProductInput) =>
      createAdminProductRequest(payload),
    onSuccess: () => invalidateCatalogScopes(queryClient),
  });
}

export function useUpdateAdminProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAdminProductInput;
    }) => updateAdminProductRequest(id, payload),
    onSuccess: () => invalidateCatalogScopes(queryClient),
  });
}

export function useArchiveAdminProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ArchiveAdminEntityInput;
    }) => archiveAdminProductRequest(id, payload),
    onSuccess: () => invalidateCatalogScopes(queryClient),
  });
}

export function useAdminProductEditor(
  profile: AdminSessionProfile,
  productId: string,
  initialData?: AdminProductEditorAggregate,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_PRODUCT_EDITOR(toIdentity(profile), productId),
    queryFn: async ({ signal }) => {
      const response = await readAdminProductEditorRequest(productId, signal);
      return response.data.editor;
    },
    initialData,
    enabled: profile.role === 'owner' && Boolean(productId),
    staleTime: 0,
    gcTime: 60_000,
    retry: false,
  });
}

export function useSaveAdminProductConfiguration(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveProductConfigurationInput) =>
      saveAdminProductConfigurationRequest(productId, payload),
    onSuccess: () => invalidateCatalogScopes(queryClient),
  });
}

export function useUploadAdminProductMedia() {
  return useMutation({
    mutationFn: (file: File) => uploadAdminProductMediaRequest(file),
  });
}

export function useAdminBranches(
  profile: AdminSessionProfile,
  initialData?: AdminBranchesResponse,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_BRANCHES(toIdentity(profile)),
    queryFn: async ({ signal }) => {
      const response = await readAdminBranchesRequest(signal);
      return response.data;
    },
    initialData,
    enabled: profile.role === 'owner',
    staleTime: 0,
    gcTime: 60_000,
    retry: false,
  });
}

export function useUpdateAdminBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      branchId,
      payload,
    }: {
      branchId: string;
      payload: UpdateAdminBranchInput;
    }) => updateAdminBranchRequest(branchId, payload),
    onSuccess: () => invalidateBranchOfferScopes(queryClient),
  });
}

export function useReplaceAdminBranchHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      branchId,
      payload,
    }: {
      branchId: string;
      payload: ReplaceBranchHoursInput;
    }) => replaceAdminBranchHoursRequest(branchId, payload),
    onSuccess: () => invalidateBranchOfferScopes(queryClient),
  });
}

export function useAdminAvailability(
  profile: AdminSessionProfile,
  params: Partial<AdminAvailabilityQuery>,
  initialData?: AdminAvailabilityListResponse,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_AVAILABILITY(toIdentity(profile), {
      branchId: params.branchId ?? null,
      search: params.search ?? null,
      availabilityStatus: params.availabilityStatus ?? null,
      listed: params.listed ?? 'all',
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 24,
    }),
    queryFn: async ({ signal }) => {
      const response = await readAdminAvailabilityRequest(params, signal);
      return response.data;
    },
    initialData,
    enabled: profile.role === 'owner' || profile.role === 'branch_admin',
    staleTime: 0,
    gcTime: 60_000,
    retry: false,
  });
}

export function useUpsertAdminAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      branchId,
      variantId,
      payload,
    }: {
      branchId: string;
      variantId: string;
      payload: UpsertBranchAvailabilityInput;
    }) => upsertAdminAvailabilityRequest(branchId, variantId, payload),
    onSuccess: () => invalidateBranchOfferScopes(queryClient),
  });
}

export function useBulkUpdateAdminAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkUpdateAvailabilityInput) =>
      bulkUpdateAdminAvailabilityRequest(payload),
    onSuccess: (response) => {
      if (response.data.succeededCount > 0) {
        invalidateBranchOfferScopes(queryClient);
      }
    },
  });
}

export function useAdminPromotions(
  profile: AdminSessionProfile,
  initialData?: AdminPromotionsListResponse,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_PROMOTIONS(toIdentity(profile)),
    queryFn: async ({ signal }) => {
      const response = await readAdminPromotionsRequest(signal);
      return response.data;
    },
    initialData,
    enabled: profile.role === 'owner',
    staleTime: 0,
    gcTime: 60_000,
    retry: false,
  });
}

export function useCreateAdminPromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveAdminPromotionInput) =>
      createAdminPromotionRequest(payload),
    onSuccess: () => invalidatePromotionScopes(queryClient),
  });
}

export function useUpdateAdminPromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SaveAdminPromotionInput;
    }) => saveAdminPromotionRequest(id, payload),
    onSuccess: () => invalidatePromotionScopes(queryClient),
  });
}

export function useArchiveAdminPromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      expectedUpdatedAt,
    }: {
      id: string;
      expectedUpdatedAt: string;
    }) => archiveAdminPromotionRequest(id, { expectedUpdatedAt }),
    onSuccess: () => invalidatePromotionScopes(queryClient),
  });
}

export function useSaveAdminShippingBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveAdminShippingBannerInput) =>
      saveAdminShippingBannerRequest(payload),
    onSuccess: () => invalidatePromotionScopes(queryClient),
  });
}
