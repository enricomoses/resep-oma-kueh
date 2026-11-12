'use client';
import { SlidersHorizontal } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Drawer } from '@/components/ui/drawer';
import { Feedback } from '@/components/ui/feedback';
import {
  CATALOG_AVAILABILITY,
  CATALOG_COPY,
  CATALOG_LIMITS,
  CATALOG_QUERY_PARAMS,
  CATALOG_SORTS,
} from '@/constants/catalog.constant';
import type { serializeCatalogQueryKey } from '@/constants/catalog.constant';
import { SITE_COPY } from '@/constants/site.constant';
import { useBranches } from '@/hooks/use-branches';
import { useCatalog, useCategories } from '@/hooks/use-catalog';
import type { InitialCatalogSection } from '@/hooks/use-catalog';
import { cn } from '@/utils';
import type {
  CatalogDirectory,
  CatalogQueryInput,
  PublicCategoryDirectory,
} from '@/types/catalog';
import { MenuFilterPanel } from './menu-filter-panel';
import type { MenuFilterState } from './menu-filter-panel';
import { MenuPagination } from './menu-pagination';
import { MenuProductCard } from './menu-product-card';

interface MenuViewProps {
  initialCategories: InitialCatalogSection<PublicCategoryDirectory>;
  initialCatalog: {
    key: ReturnType<typeof serializeCatalogQueryKey>;
    result: InitialCatalogSection<CatalogDirectory>;
  };
  className?: string;
}

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

export function MenuView({
  initialCategories,
  initialCatalog,
  className,
}: MenuViewProps) {
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

  const updateUrlParams = (
    updates: Record<string, string | null | undefined>,
    resetPage = true,
  ) => {
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
  };

  // Debounce search input with unmount & dependency cleanup
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft, urlQ]);

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

  const filterState: MenuFilterState = {
    searchDraft,
    category: urlCategory ?? '',
    tag: urlTag ?? '',
    availability: urlAvailability ?? '',
    minPriceDraft,
    maxPriceDraft,
    sort: urlSort,
  };

  return (
    <main
      id={SITE_COPY.MAIN_ID}
      tabIndex={-1}
      className={cn('content-container menu-page-main', className)}
    >
      <section className="menu-header-section" aria-labelledby="menu-title">
        <div className="content-header-block">
          <Badge tone="accent">{CATALOG_COPY.EYEBROW}</Badge>
          <h1 id="menu-title" className="editorial-display">
            {CATALOG_COPY.TITLE}
          </h1>
          <p className="editorial-lead">{CATALOG_COPY.SUBTITLE}</p>
        </div>

        {!hasBranchSelected ? (
          <Card tone="cream" className="menu-branch-notice-card">
            <h2>{CATALOG_COPY.BRANCH_NOTICE_TITLE}</h2>
            <p>{CATALOG_COPY.BRANCH_NOTICE_BODY}</p>
          </Card>
        ) : null}
      </section>

      <section
        className="menu-catalog-section"
        aria-label={CATALOG_COPY.FILTER_TITLE}
      >
        <div className="menu-toolbar-mobile">
          <Button
            variant="secondary"
            onClick={() => setMobileFilterOpen(true)}
            aria-haspopup="dialog"
          >
            <SlidersHorizontal size={18} aria-hidden="true" />
            {CATALOG_COPY.OPEN_FILTERS_MOBILE}
          </Button>
          {catalogData ? (
            <p className="menu-result-summary" aria-live="polite">
              {CATALOG_COPY.RESULT_SUMMARY(
                catalogData.items.length,
                catalogData.total,
              )}
            </p>
          ) : null}
        </div>

        <div className="menu-layout-grid">
          <aside
            className="menu-sidebar-desktop"
            aria-label={CATALOG_COPY.FILTER_TITLE}
          >
            <Card className="menu-filter-card">
              <h2 className="menu-filter-heading">
                {CATALOG_COPY.FILTER_TITLE}
              </h2>
              <MenuFilterPanel
                idPrefix="desktop"
                categories={categories}
                hasBranchSelected={hasBranchSelected}
                filters={filterState}
                priceError={priceError}
                onSearchDraftChange={setSearchDraft}
                onCategoryChange={(value) =>
                  updateUrlParams({
                    [CATALOG_QUERY_PARAMS.CATEGORY]: value || null,
                  })
                }
                onTagChange={(value) =>
                  updateUrlParams({
                    [CATALOG_QUERY_PARAMS.TAG]: value || null,
                  })
                }
                onAvailabilityChange={(value) =>
                  updateUrlParams({
                    [CATALOG_QUERY_PARAMS.AVAILABILITY]: value || null,
                  })
                }
                onMinPriceDraftChange={setMinPriceDraft}
                onMaxPriceDraftChange={setMaxPriceDraft}
                onApplyPriceRange={handleApplyPriceRange}
                onSortChange={(value) =>
                  updateUrlParams({
                    [CATALOG_QUERY_PARAMS.SORT]: value,
                  })
                }
                onResetFilters={handleResetFilters}
              />
            </Card>
          </aside>

          <div className="menu-results-column">
            {catalogData ? (
              <div className="menu-results-header">
                <p className="menu-result-summary" aria-live="polite">
                  {CATALOG_COPY.RESULT_SUMMARY(
                    catalogData.items.length,
                    catalogData.total,
                  )}
                </p>
              </div>
            ) : null}

            {isCatalogError ? (
              <div className="content-error-block">
                <Feedback
                  tone="error"
                  title={CATALOG_COPY.ERROR_TITLE}
                  className="content-feedback-banner"
                >
                  {CATALOG_COPY.ERROR_BODY}
                </Feedback>
                <Button
                  variant="secondary"
                  onClick={() => {
                    void categoriesQuery.refetch();
                    void catalogQuery.refetch();
                  }}
                >
                  {CATALOG_COPY.RETRY_CTA}
                </Button>
              </div>
            ) : catalogData && catalogData.items.length === 0 ? (
              <div className="content-error-block">
                <Feedback
                  title={CATALOG_COPY.EMPTY_TITLE}
                  className="content-feedback-banner"
                >
                  {CATALOG_COPY.EMPTY_BODY}
                </Feedback>
                <Button variant="secondary" onClick={handleResetFilters}>
                  {CATALOG_COPY.RESET_FILTERS}
                </Button>
              </div>
            ) : catalogData ? (
              <>
                <div className="product-grid menu-product-grid">
                  {catalogData.items.map((product) => (
                    <MenuProductCard
                      key={product.id}
                      product={product}
                      hasBranchSelected={hasBranchSelected}
                      branchCode={activeBranch?.code ?? branchState.code}
                    />
                  ))}
                </div>
                <MenuPagination
                  page={catalogData.page}
                  totalPages={catalogData.totalPages}
                  onPageChange={(nextPage) =>
                    updateUrlParams(
                      {
                        [CATALOG_QUERY_PARAMS.PAGE]:
                          nextPage <= 1 ? null : String(nextPage),
                      },
                      false,
                    )
                  }
                />
              </>
            ) : null}
          </div>
        </div>
      </section>

      <Drawer
        open={mobileFilterOpen}
        onOpenChange={setMobileFilterOpen}
        title={CATALOG_COPY.FILTER_TITLE}
      >
        <div className="menu-mobile-drawer-body">
          <MenuFilterPanel
            idPrefix="mobile"
            categories={categories}
            hasBranchSelected={hasBranchSelected}
            filters={filterState}
            priceError={priceError}
            onSearchDraftChange={setSearchDraft}
            onCategoryChange={(value) =>
              updateUrlParams({
                [CATALOG_QUERY_PARAMS.CATEGORY]: value || null,
              })
            }
            onTagChange={(value) =>
              updateUrlParams({
                [CATALOG_QUERY_PARAMS.TAG]: value || null,
              })
            }
            onAvailabilityChange={(value) =>
              updateUrlParams({
                [CATALOG_QUERY_PARAMS.AVAILABILITY]: value || null,
              })
            }
            onMinPriceDraftChange={setMinPriceDraft}
            onMaxPriceDraftChange={setMaxPriceDraft}
            onApplyPriceRange={handleApplyPriceRange}
            onSortChange={(value) =>
              updateUrlParams({
                [CATALOG_QUERY_PARAMS.SORT]: value,
              })
            }
            onResetFilters={handleResetFilters}
          />
          <Button onClick={() => setMobileFilterOpen(false)}>
            {CATALOG_COPY.CLOSE_FILTERS_MOBILE}
          </Button>
        </div>
      </Drawer>
    </main>
  );
}
