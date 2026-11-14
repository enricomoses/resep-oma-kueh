'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import type { serializeCatalogQueryKey } from '@/constants/catalog.constant';
import {
  CATALOG_AVAILABILITY,
  CATALOG_LIMITS,
  CATALOG_QUERY_PARAMS,
  CATALOG_SORTS,
} from '@/constants/catalog.constant';
import type {
  CatalogDirectory,
  CatalogQueryInput,
  PublicCategoryDirectory,
} from '@/types/catalog';

import { useBranches } from './use-branches';
import {
  type InitialCatalogSection,
  useCatalog,
  useCategories,
} from './use-catalog';

function parseUrlEnum<T extends string>(
  value: string | null,
  allowed: readonly T[],
): T | undefined {
  if (!value) return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function parseUrlPositiveInt(
  value: string | null,
  fallback: number,
  max: number,
): number {
  if (!value || !/^\d+$/.test(value.trim())) return fallback;
  const num = Number(value.trim());
  if (!Number.isSafeInteger(num) || num < 1 || num > max) return fallback;
  return num;
}

function parseUrlPrice(value: string | null): number | undefined {
  if (!value || !/^\d+$/.test(value.trim())) return undefined;
  const num = Number(value.trim());
  if (
    !Number.isSafeInteger(num) ||
    num < 0 ||
    num > CATALOG_LIMITS.MAX_UNIT_IDR
  ) {
    return undefined;
  }
  return num;
}

interface UseMenuFiltersParams {
  initialCategories: InitialCatalogSection<PublicCategoryDirectory>;
  initialCatalog: {
    key: ReturnType<typeof serializeCatalogQueryKey>;
    result: InitialCatalogSection<CatalogDirectory>;
  };
}

/**
 * Manages public menu URL filter params, debounced search state, and catalog queries.
 */
export function useMenuFilters({
  initialCategories,
  initialCatalog,
}: UseMenuFiltersParams) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const branchState = useBranches();

  const urlBranch =
    searchParams.get(CATALOG_QUERY_PARAMS.BRANCH)?.trim() || undefined;
  const matchedUrlBranch = urlBranch
    ? (branchState.items.find((b) => b.code === urlBranch) ?? null)
    : null;
  const activeBranch = branchState.selected ?? matchedUrlBranch;
  const effectiveBranchCode = activeBranch?.code ?? urlBranch;
  const hasBranchSelected =
    Boolean(activeBranch) ||
    (initialCatalog.result.status === 'success' &&
      initialCatalog.result.data.resolvedBranchId !== null &&
      initialCatalog.key.branch === (urlBranch ?? null));

  const urlCategory =
    searchParams.get(CATALOG_QUERY_PARAMS.CATEGORY)?.trim() || undefined;
  const urlQ = searchParams.get(CATALOG_QUERY_PARAMS.Q)?.trim() || undefined;
  const urlTag =
    searchParams.get(CATALOG_QUERY_PARAMS.TAG)?.trim() || undefined;
  const urlAvailability = parseUrlEnum(
    searchParams.get(CATALOG_QUERY_PARAMS.AVAILABILITY),
    CATALOG_AVAILABILITY,
  );
  const urlMinPrice = parseUrlPrice(
    searchParams.get(CATALOG_QUERY_PARAMS.MIN_PRICE),
  );
  const urlMaxPrice = parseUrlPrice(
    searchParams.get(CATALOG_QUERY_PARAMS.MAX_PRICE),
  );
  const urlSort =
    parseUrlEnum(searchParams.get(CATALOG_QUERY_PARAMS.SORT), CATALOG_SORTS) ??
    'featured';
  const urlPage = parseUrlPositiveInt(
    searchParams.get(CATALOG_QUERY_PARAMS.PAGE),
    CATALOG_LIMITS.DEFAULT_PAGE,
    10_000,
  );
  const urlLimit = parseUrlPositiveInt(
    searchParams.get(CATALOG_QUERY_PARAMS.LIMIT),
    CATALOG_LIMITS.DEFAULT_LIMIT,
    CATALOG_LIMITS.MAX_LIMIT,
  );

  const [searchDraft, setSearchDraft] = useState(urlQ ?? '');
  const [prevUrlQ, setPrevUrlQ] = useState(urlQ);
  if (urlQ !== prevUrlQ) {
    setPrevUrlQ(urlQ);
    setSearchDraft(urlQ ?? '');
  }

  const [minPriceDraft, setMinPriceDraft] = useState(
    urlMinPrice !== undefined ? String(urlMinPrice) : '',
  );
  const [maxPriceDraft, setMaxPriceDraft] = useState(
    urlMaxPrice !== undefined ? String(urlMaxPrice) : '',
  );
  const [priceError, setPriceError] = useState<string | undefined>(undefined);
  const [prevUrlPrices, setPrevUrlPrices] = useState({
    min: urlMinPrice,
    max: urlMaxPrice,
  });
  if (urlMinPrice !== prevUrlPrices.min || urlMaxPrice !== prevUrlPrices.max) {
    setPrevUrlPrices({ min: urlMinPrice, max: urlMaxPrice });
    setMinPriceDraft(urlMinPrice !== undefined ? String(urlMinPrice) : '');
    setMaxPriceDraft(urlMaxPrice !== undefined ? String(urlMaxPrice) : '');
    setPriceError(undefined);
  }
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const updateUrlParams = useCallback(
    (updates: Record<string, string | null | undefined>, resetPage = true) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val === undefined || val === null || val.trim() === '') {
          next.delete(key);
        } else {
          next.set(key, val.trim());
        }
      }
      if (resetPage) {
        next.delete(CATALOG_QUERY_PARAMS.PAGE);
      }
      if (next.get(CATALOG_QUERY_PARAMS.SORT) === 'featured') {
        next.delete(CATALOG_QUERY_PARAMS.SORT);
      }
      if (
        next.get(CATALOG_QUERY_PARAMS.LIMIT) ===
        String(CATALOG_LIMITS.DEFAULT_LIMIT)
      ) {
        next.delete(CATALOG_QUERY_PARAMS.LIMIT);
      }
      const queryString = next.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const trimmed = searchDraft.trim();
    const currentUrlQ = urlQ ?? '';
    if (trimmed === currentUrlQ) return;

    const timerId = window.setTimeout(() => {
      updateUrlParams({
        [CATALOG_QUERY_PARAMS.Q]: trimmed || null,
      });
    }, CATALOG_LIMITS.DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [searchDraft, urlQ, updateUrlParams]);

  const validMinMax =
    urlMinPrice !== undefined &&
    urlMaxPrice !== undefined &&
    urlMinPrice > urlMaxPrice
      ? { minPriceIdr: undefined, maxPriceIdr: undefined }
      : { minPriceIdr: urlMinPrice, maxPriceIdr: urlMaxPrice };

  const queryParams: CatalogQueryInput = {
    branch: effectiveBranchCode,
    category: urlCategory,
    q: urlQ,
    tag: urlTag,
    availability: hasBranchSelected ? urlAvailability : undefined,
    minPriceIdr: hasBranchSelected ? validMinMax.minPriceIdr : undefined,
    maxPriceIdr: hasBranchSelected ? validMinMax.maxPriceIdr : undefined,
    sort: urlSort,
    page: urlPage,
    limit: urlLimit,
  };

  const categoriesQuery = useCategories(initialCategories);
  const catalogQuery = useCatalog(queryParams, initialCatalog);

  const categories =
    categoriesQuery.data?.data.items ??
    (initialCategories.status === 'success'
      ? initialCategories.data.items
      : []);

  const catalogData = catalogQuery.data?.data;
  const isCatalogError =
    catalogQuery.isError ||
    (!catalogData &&
      !catalogQuery.isFetching &&
      initialCatalog.result.status === 'error');

  const handleApplyPriceRange = () => {
    const minVal = minPriceDraft.trim()
      ? Number(minPriceDraft.trim())
      : undefined;
    const maxVal = maxPriceDraft.trim()
      ? Number(maxPriceDraft.trim())
      : undefined;
    if (minVal !== undefined && maxVal !== undefined && minVal > maxVal) {
      setPriceError('Harga minimum tidak boleh melebihi harga maksimum.');
      return;
    }
    setPriceError(undefined);
    updateUrlParams({
      [CATALOG_QUERY_PARAMS.MIN_PRICE]:
        minVal !== undefined ? String(minVal) : null,
      [CATALOG_QUERY_PARAMS.MAX_PRICE]:
        maxVal !== undefined ? String(maxVal) : null,
    });
  };

  const handleResetFilters = () => {
    setSearchDraft('');
    setMinPriceDraft('');
    setMaxPriceDraft('');
    setPriceError(undefined);
    updateUrlParams({
      [CATALOG_QUERY_PARAMS.CATEGORY]: null,
      [CATALOG_QUERY_PARAMS.Q]: null,
      [CATALOG_QUERY_PARAMS.TAG]: null,
      [CATALOG_QUERY_PARAMS.AVAILABILITY]: null,
      [CATALOG_QUERY_PARAMS.MIN_PRICE]: null,
      [CATALOG_QUERY_PARAMS.MAX_PRICE]: null,
      [CATALOG_QUERY_PARAMS.SORT]: null,
    });
  };

  const filterState = {
    searchDraft,
    category: urlCategory ?? '',
    tag: urlTag ?? '',
    availability: urlAvailability ?? '',
    minPriceDraft,
    maxPriceDraft,
    sort: urlSort,
  };

  return {
    categories,
    catalogData,
    isCatalogError,
    hasBranchSelected,
    displayBranchCode: activeBranch?.code ?? branchState.code,
    filterState,
    priceError,
    mobileFilterOpen,
    setMobileFilterOpen,
    setSearchDraft,
    setMinPriceDraft,
    setMaxPriceDraft,
    updateUrlParams,
    handleApplyPriceRange,
    handleResetFilters,
    handleRetryCatalog: () => {
      void categoriesQuery.refetch();
      void catalogQuery.refetch();
    },
  };
}
