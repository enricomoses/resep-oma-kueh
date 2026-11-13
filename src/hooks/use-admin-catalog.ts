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
  createAdminCategoryRequest,
  createAdminProductRequest,
  readAdminCategoriesRequest,
  readAdminOverviewRequest,
  readAdminProductDetailRequest,
  readAdminProductEditorRequest,
  readAdminProductsRequest,
  saveAdminProductConfigurationRequest,
  updateAdminCategoryRequest,
  updateAdminProductRequest,
  uploadAdminProductMediaRequest,
} from '@/services/admin-catalog.service';
import type {
  AdminCategoryListResponse,
  AdminOverviewResponse,
  AdminProductEditorAggregate,
  AdminProductListResponse,
  AdminProductQuery,
  ArchiveAdminEntityInput,
  CreateAdminCategoryInput,
  CreateAdminProductInput,
  SaveProductConfigurationInput,
  UpdateAdminCategoryInput,
  UpdateAdminProductInput,
} from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';

const PUBLIC_CATALOG_PREFIX = ['resep-oma-kueh', 'catalog'] as const;
const PUBLIC_PRODUCT_DETAIL_PREFIX = [
  'resep-oma-kueh',
  'product-detail',
] as const;

function toIdentity(profile: AdminSessionProfile) {
  return {
    userId: profile.userId,
    role: profile.role,
    branchId: profile.branchId,
  };
}

async function invalidateCatalogScopes(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_ROOT }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES }),
    queryClient.invalidateQueries({ queryKey: PUBLIC_CATALOG_PREFIX }),
    queryClient.invalidateQueries({ queryKey: PUBLIC_PRODUCT_DETAIL_PREFIX }),
  ]);
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
