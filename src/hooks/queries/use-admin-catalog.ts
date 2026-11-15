'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  QUERY_KEYS,
  toAdminQueryIdentity,
} from '@/constants/query-keys.constant';
import {
  ADMIN_QUERY_DEFAULTS,
  invalidateQueryKeys,
  unwrapData,
} from '@/hooks/queries/query-helpers';
import { adminCatalogService } from '@/services/admin-catalog.service';
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

const CATALOG_INVALIDATION_KEYS = [
  QUERY_KEYS.ADMIN_ROOT,
  QUERY_KEYS.CATEGORIES,
  QUERY_KEYS.CATALOG_ALL,
  QUERY_KEYS.PRODUCT_DETAIL_ALL,
  QUERY_KEYS.PROMOTIONS_ALL,
] as const;

const BRANCH_OFFER_INVALIDATION_KEYS = [
  QUERY_KEYS.ADMIN_ROOT,
  QUERY_KEYS.BRANCHES_ALL,
  QUERY_KEYS.CATEGORIES,
  QUERY_KEYS.CATALOG_ALL,
  QUERY_KEYS.PRODUCT_DETAIL_ALL,
  QUERY_KEYS.PROMOTIONS_ALL,
  QUERY_KEYS.CONTENT_ALL,
  QUERY_KEYS.CART_VALIDATE_ALL,
] as const;

/** Fetches operational summary metrics for the active admin dashboard. */
export function useAdminOverview(
  profile: AdminSessionProfile,
  initialData?: AdminOverviewResponse,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_OVERVIEW(toAdminQueryIdentity(profile)),
    queryFn: ({ signal }) =>
      unwrapData(adminCatalogService.getOverview(signal)),
    initialData,
    ...ADMIN_QUERY_DEFAULTS,
  });
}

/** Fetches owner-managed product categories. */
export function useAdminCategories(
  profile: AdminSessionProfile,
  initialData?: AdminCategoryListResponse,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_CATEGORIES(toAdminQueryIdentity(profile)),
    queryFn: ({ signal }) =>
      unwrapData(adminCatalogService.getCategories(signal)),
    initialData,
    enabled: profile.role === 'owner',
    ...ADMIN_QUERY_DEFAULTS,
  });
}

/** Creates an admin category and invalidates catalog query scopes. */
export function useCreateAdminCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminCategoryInput) =>
      adminCatalogService.createCategory(payload),
    onSuccess: () =>
      invalidateQueryKeys(queryClient, CATALOG_INVALIDATION_KEYS),
  });
}

/** Updates an admin category and invalidates catalog query scopes. */
export function useUpdateAdminCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAdminCategoryInput;
    }) => adminCatalogService.updateCategory(id, payload),
    onSuccess: () =>
      invalidateQueryKeys(queryClient, CATALOG_INVALIDATION_KEYS),
  });
}

/** Soft-archives an admin category and invalidates catalog query scopes. */
export function useArchiveAdminCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ArchiveAdminEntityInput;
    }) => adminCatalogService.archiveCategory(id, payload),
    onSuccess: () =>
      invalidateQueryKeys(queryClient, CATALOG_INVALIDATION_KEYS),
  });
}

/** Fetches paginated owner-managed products for the catalog directory. */
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
    queryKey: QUERY_KEYS.ADMIN_PRODUCTS(
      toAdminQueryIdentity(profile),
      paramsKey,
    ),
    queryFn: ({ signal }) =>
      unwrapData(adminCatalogService.getProducts(query, signal)),
    initialData,
    enabled: profile.role === 'owner',
    ...ADMIN_QUERY_DEFAULTS,
  });
}

/** Conditionally fetches a single admin product detail record by ID. */
export function useAdminProductDetail(
  profile: AdminSessionProfile,
  productId: string | null,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_PRODUCT_DETAIL(
      toAdminQueryIdentity(profile),
      productId ?? 'none',
    ),
    queryFn: async ({ signal }) => {
      const data = await unwrapData(
        adminCatalogService.getProductDetail(productId as string, signal),
      );
      return data.product;
    },
    enabled: profile.role === 'owner' && Boolean(productId),
    ...ADMIN_QUERY_DEFAULTS,
  });
}

/** Creates an admin product and invalidates catalog query scopes. */
export function useCreateAdminProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminProductInput) =>
      adminCatalogService.createProduct(payload),
    onSuccess: () =>
      invalidateQueryKeys(queryClient, CATALOG_INVALIDATION_KEYS),
  });
}

/** Updates an admin product and invalidates catalog query scopes. */
export function useUpdateAdminProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAdminProductInput;
    }) => adminCatalogService.updateProduct(id, payload),
    onSuccess: () =>
      invalidateQueryKeys(queryClient, CATALOG_INVALIDATION_KEYS),
  });
}

/** Soft-archives an admin product and invalidates catalog query scopes. */
export function useArchiveAdminProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ArchiveAdminEntityInput;
    }) => adminCatalogService.archiveProduct(id, payload),
    onSuccess: () =>
      invalidateQueryKeys(queryClient, CATALOG_INVALIDATION_KEYS),
  });
}

/** Fetches full aggregate state required for the product configuration editor. */
export function useAdminProductEditor(
  profile: AdminSessionProfile,
  productId: string,
  initialData?: AdminProductEditorAggregate,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_PRODUCT_EDITOR(
      toAdminQueryIdentity(profile),
      productId,
    ),
    queryFn: async ({ signal }) => {
      const data = await unwrapData(
        adminCatalogService.getProductEditor(productId, signal),
      );
      return data.editor;
    },
    initialData,
    enabled: profile.role === 'owner' && Boolean(productId),
    ...ADMIN_QUERY_DEFAULTS,
  });
}

/** Saves aggregate product configuration and invalidates catalog query scopes. */
export function useSaveAdminProductConfiguration(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveProductConfigurationInput) =>
      adminCatalogService.saveProductConfiguration(productId, payload),
    onSuccess: () =>
      invalidateQueryKeys(queryClient, CATALOG_INVALIDATION_KEYS),
  });
}

/** Uploads an image asset to admin media storage. */
export function useUploadAdminProductMedia() {
  return useMutation({
    mutationFn: (file: File) => adminCatalogService.uploadMedia(file),
  });
}

/** Fetches owner-managed bakery branches and weekly operating hours. */
export function useAdminBranches(
  profile: AdminSessionProfile,
  initialData?: AdminBranchesResponse,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_BRANCHES(toAdminQueryIdentity(profile)),
    queryFn: ({ signal }) =>
      unwrapData(adminCatalogService.getBranches(signal)),
    initialData,
    enabled: profile.role === 'owner',
    ...ADMIN_QUERY_DEFAULTS,
  });
}

/** Updates branch settings and invalidates branch and public offering caches. */
export function useUpdateAdminBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      branchId,
      payload,
    }: {
      branchId: string;
      payload: UpdateAdminBranchInput;
    }) => adminCatalogService.updateBranch(branchId, payload),
    onSuccess: () =>
      invalidateQueryKeys(queryClient, BRANCH_OFFER_INVALIDATION_KEYS),
  });
}

/** Replaces branch operating hours and invalidates branch and public offering caches. */
export function useReplaceAdminBranchHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      branchId,
      payload,
    }: {
      branchId: string;
      payload: ReplaceBranchHoursInput;
    }) => adminCatalogService.replaceBranchHours(branchId, payload),
    onSuccess: () =>
      invalidateQueryKeys(queryClient, BRANCH_OFFER_INVALIDATION_KEYS),
  });
}

/** Fetches paginated branch variant availability offers for owner or branch admin. */
export function useAdminAvailability(
  profile: AdminSessionProfile,
  params: Partial<AdminAvailabilityQuery>,
  initialData?: AdminAvailabilityListResponse,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_AVAILABILITY(toAdminQueryIdentity(profile), {
      branchId: params.branchId ?? null,
      search: params.search ?? null,
      availabilityStatus: params.availabilityStatus ?? null,
      listed: params.listed ?? 'all',
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 24,
    }),
    queryFn: ({ signal }) =>
      unwrapData(adminCatalogService.getAvailability(params, signal)),
    initialData,
    enabled: profile.role === 'owner' || profile.role === 'branch_admin',
    ...ADMIN_QUERY_DEFAULTS,
  });
}

/** Updates a single branch variant offer and invalidates branch and public caches. */
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
    }) => adminCatalogService.upsertAvailability(branchId, variantId, payload),
    onSuccess: () =>
      invalidateQueryKeys(queryClient, BRANCH_OFFER_INVALIDATION_KEYS),
  });
}

/** Executes bulk branch availability updates and invalidates caches on partial/full success. */
export function useBulkUpdateAdminAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkUpdateAvailabilityInput) =>
      adminCatalogService.bulkUpdateAvailability(payload),
    onSuccess: async (response) => {
      if (response.data.succeededCount > 0) {
        await invalidateQueryKeys(queryClient, BRANCH_OFFER_INVALIDATION_KEYS);
      }
    },
  });
}

/** Fetches owner-managed promotions and shipping info banner. */
export function useAdminPromotions(
  profile: AdminSessionProfile,
  initialData?: AdminPromotionsListResponse,
) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_PROMOTIONS(toAdminQueryIdentity(profile)),
    queryFn: ({ signal }) =>
      unwrapData(adminCatalogService.getPromotions(signal)),
    initialData,
    enabled: profile.role === 'owner',
    ...ADMIN_QUERY_DEFAULTS,
  });
}

/** Creates a promotion and invalidates branch, catalog, cart, and admin caches. */
export function useCreateAdminPromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveAdminPromotionInput) =>
      adminCatalogService.createPromotion(payload),
    onSuccess: () =>
      invalidateQueryKeys(queryClient, BRANCH_OFFER_INVALIDATION_KEYS),
  });
}

/** Updates a promotion and invalidates branch, catalog, cart, and admin caches. */
export function useUpdateAdminPromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SaveAdminPromotionInput;
    }) => adminCatalogService.savePromotion(id, payload),
    onSuccess: () =>
      invalidateQueryKeys(queryClient, BRANCH_OFFER_INVALIDATION_KEYS),
  });
}

/** Soft-archives a promotion and invalidates branch, catalog, cart, and admin caches. */
export function useArchiveAdminPromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      expectedUpdatedAt,
    }: {
      id: string;
      expectedUpdatedAt: string;
    }) => adminCatalogService.archivePromotion(id, { expectedUpdatedAt }),
    onSuccess: () =>
      invalidateQueryKeys(queryClient, BRANCH_OFFER_INVALIDATION_KEYS),
  });
}

/** Saves the shipping banner configuration and invalidates public offering caches. */
export function useSaveAdminShippingBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveAdminShippingBannerInput) =>
      adminCatalogService.saveShippingBanner(payload),
    onSuccess: () =>
      invalidateQueryKeys(queryClient, BRANCH_OFFER_INVALIDATION_KEYS),
  });
}
