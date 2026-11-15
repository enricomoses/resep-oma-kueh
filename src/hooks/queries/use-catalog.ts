'use client';

import { useQuery } from '@tanstack/react-query';

import { serializeCatalogQueryKey } from '@/constants/catalog.constant';
import { QUERY_KEYS, STALE_TIME } from '@/constants/query-keys.constant';
import { unwrapData } from '@/hooks/queries/query-helpers';
import { catalogService } from '@/services/catalog.service';
import type {
  CatalogDirectory,
  CatalogQueryInput,
  InitialCatalogSection,
  ProductDetail,
  PublicCategoryDirectory,
} from '@/types/catalog';

/** Fetches public menu categories, hydrating from SSR data when available. */
export function useCategories(
  initial?: InitialCatalogSection<PublicCategoryDirectory>,
) {
  return useQuery({
    queryKey: QUERY_KEYS.CATEGORIES,
    queryFn: ({ signal }) => unwrapData(catalogService.getCategories(signal)),
    staleTime: STALE_TIME.PUBLIC,
    initialData: initial?.status === 'success' ? initial.data : undefined,
  });
}

/** Fetches filtered, branch-aware paginated menu catalog items. */
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
    queryFn: ({ signal }) =>
      unwrapData(catalogService.getPaginated(params, signal)),
    staleTime: params.branch ? STALE_TIME.BRANCH_OFFERS : STALE_TIME.PUBLIC,
    initialData:
      isInitialMatch && initial?.result.status === 'success'
        ? initial.result.data
        : undefined,
  });
}

/** Fetches full public product detail and branch-scoped variant offerings. */
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
    queryFn: ({ signal }) =>
      unwrapData(catalogService.getBySlug(slug, branch, signal)),
    staleTime: branch ? STALE_TIME.BRANCH_OFFERS : STALE_TIME.PUBLIC,
    initialData: isInitialMatch ? initial.data : undefined,
  });
}
