import { MenuProductCard } from '@/components/common/commerce/menu-product-card';
import { EmptyState } from '@/components/common/feedback/empty-state';
import { ErrorState } from '@/components/common/feedback/error-state';
import { Button } from '@/components/ui/button';
import { CATALOG_COPY } from '@/constants/catalog.constant';
import type { CatalogDirectory } from '@/types/catalog';
import { cn } from '@/utils';

import { MenuPagination } from './menu-pagination';

interface MenuResultsSectionProps {
  catalogData: CatalogDirectory | undefined;
  isCatalogError: boolean;
  hasBranchSelected: boolean;
  branchCode: string | null;
  onRetry: () => void;
  onResetFilters: () => void;
  onPageChange: (nextPage: number) => void;
  className?: string;
}

/**
 * Renders the catalog result count, empty/error states, product grid, and pagination controls.
 */
export function MenuResultsSection({
  catalogData,
  isCatalogError,
  hasBranchSelected,
  branchCode,
  onRetry,
  onResetFilters,
  onPageChange,
  className,
}: MenuResultsSectionProps) {
  return (
    <div className={cn('menu-results-column', className)}>
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
        <ErrorState
          className="content-error-block"
          title={CATALOG_COPY.ERROR_TITLE}
          message={CATALOG_COPY.ERROR_BODY}
          onRetry={onRetry}
          retryLabel={CATALOG_COPY.RETRY_CTA}
          announce={false}
        />
      ) : catalogData && catalogData.items.length === 0 ? (
        <EmptyState
          className="content-error-block"
          title={CATALOG_COPY.EMPTY_TITLE}
          description={CATALOG_COPY.EMPTY_BODY}
          action={
            <Button variant="secondary" onClick={onResetFilters}>
              {CATALOG_COPY.RESET_FILTERS}
            </Button>
          }
        />
      ) : catalogData ? (
        <>
          <div className="product-grid menu-product-grid">
            {catalogData.items.map((product) => (
              <MenuProductCard
                key={product.id}
                product={product}
                hasBranchSelected={hasBranchSelected}
                branchCode={branchCode}
                previewImageUrl={product.previewImageUrl ?? null}
              />
            ))}
          </div>
          <MenuPagination
            page={catalogData.page}
            totalPages={catalogData.totalPages}
            onPageChange={onPageChange}
          />
        </>
      ) : null}
    </div>
  );
}
