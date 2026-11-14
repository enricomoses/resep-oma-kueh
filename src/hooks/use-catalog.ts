'use client';
import { useQuery } from '@tanstack/react-query';
import { serializeCatalogQueryKey } from '@/constants/catalog.constant';
import { QUERY_KEYS, STALE_TIME } from '@/constants/query-keys.constant';
import {
  readCatalog,
  readCategories,
  readProductDetail,
} from '@/services/catalog.service';
import type {
  CatalogDirectory,
  CatalogQueryInput,
  ProductDetail,
  PublicCategoryDirectory,
} from '@/types/catalog';

export type InitialCatalogSection<T> =
  { status: 'success'; data: T } | { status: 'error' };

export function useCategories(
  initial?: InitialCatalogSection<PublicCategoryDirectory>,
) {
  return useQuery({
    queryKey: QUERY_KEYS.CATEGORIES,
    queryFn: ({ signal }) => readCategories(signal),
    staleTime: STALE_TIME.PUBLIC,
    initialData:
      initial?.status === 'success'
        ? {
            ok: true as const,
            data: initial.data,
            requestId: 'server-initial-categories',
          }
        : undefined,
  });
}

export function useCatalog(
  params: CatalogQueryInput,
  initial?: {
    key: ReturnType<typeof serializeCatalogQueryKey>;
    result: InitialCatalogSection<CatalogDirectory>;
  },
) {
  const normalizedKey = serializeCatalogQueryKey(params);
  const isInitialMatch =
    initial?.result.status === 'success' &&
    JSON.stringify(initial.key) === JSON.stringify(normalizedKey);

  return useQuery({
    queryKey: QUERY_KEYS.CATALOG(normalizedKey),
    queryFn: ({ signal }) => readCatalog(params, signal),
    staleTime: params.branch ? STALE_TIME.BRANCH_OFFERS : STALE_TIME.PUBLIC,
    initialData:
      isInitialMatch && initial?.result.status === 'success'
        ? {
            ok: true as const,
            data: initial.result.data,
            requestId: 'server-initial-catalog',
          }
        : undefined,
  });
}

export function useProductDetail(
  slug: string,
  branch: string | null,
  initial?: InitialCatalogSection<ProductDetail>,
) {
  const isInitialMatch =
    initial?.status === 'success' &&
    (initial.data.resolvedBranchCode ?? null) === (branch ?? null);

  return useQuery({
    queryKey: QUERY_KEYS.PRODUCT_DETAIL(slug, branch),
    queryFn: ({ signal }) => readProductDetail(slug, branch, signal),
    staleTime: branch ? STALE_TIME.BRANCH_OFFERS : STALE_TIME.PUBLIC,
    initialData: isInitialMatch
      ? {
          ok: true as const,
          data: initial.data,
          requestId: `server-initial-product-${slug}`,
        }
      : undefined,
  });
}
