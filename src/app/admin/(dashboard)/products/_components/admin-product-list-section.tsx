import { EmptyState } from '@/components/common/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import type {
  AdminProductItem,
  AdminProductListResponse,
} from '@/types/admin-catalog';

import { AdminProductCard } from './admin-product-card';

interface AdminProductListSectionProps {
  productPage: AdminProductListResponse;
  isFetching: boolean;
  onEdit: (product: AdminProductItem) => void;
  onArchive: (product: AdminProductItem) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

/**
 * Renders the admin product list cards with pagination controls.
 */
export function AdminProductListSection({
  productPage,
  isFetching,
  onEdit,
  onArchive,
  onPrevPage,
  onNextPage,
}: AdminProductListSectionProps) {
  return (
    <>
      {productPage.items.length === 0 ? (
        <EmptyState
          title={ADMIN_CATALOG_COPY.PRODUCTS.EMPTY}
          tone="cream"
          className="admin-empty-card"
        />
      ) : (
        <div className="admin-list-stack">
          {productPage.items.map((product) => (
            <AdminProductCard
              key={product.id}
              product={product}
              onEdit={onEdit}
              onArchive={onArchive}
            />
          ))}
        </div>
      )}

      <div className="admin-pagination">
        <p className="admin-row-meta">
          Halaman {productPage.page} dari {productPage.totalPages} · Total{' '}
          {productPage.total} produk
        </p>
        <div className="admin-inline-actions">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={productPage.page <= 1 || isFetching}
            onClick={onPrevPage}
          >
            {ADMIN_CATALOG_COPY.PRODUCTS.PAGINATION_PREV}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={productPage.page >= productPage.totalPages || isFetching}
            onClick={onNextPage}
          >
            {ADMIN_CATALOG_COPY.PRODUCTS.PAGINATION_NEXT}
          </Button>
        </div>
      </div>
    </>
  );
}
