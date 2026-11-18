import { Package } from 'lucide-react';

import { EmptyState } from '@/components/common/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
 * Renders the unified admin product directory panel with pagination footer.
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
          icon={<Package size={24} strokeWidth={1.65} aria-hidden="true" />}
          title={ADMIN_CATALOG_COPY.PRODUCTS.EMPTY}
          tone="cream"
        />
      ) : (
        <Card tone="surface" className="admin-prod-panel">
          <div className="admin-prod-list-head" aria-hidden="true">
            <span>Produk</span>
            <span>Tipe</span>
            <span>Status</span>
            <span>Varian &amp; Urutan</span>
            <span>Aksi</span>
          </div>

          <ul className="admin-prod-list">
            {productPage.items.map((product) => (
              <AdminProductCard
                key={product.id}
                product={product}
                onEdit={onEdit}
                onArchive={onArchive}
              />
            ))}
          </ul>

          <div className="admin-prod-pagination">
            <p className="admin-prod-pagination-info">
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
                disabled={
                  productPage.page >= productPage.totalPages || isFetching
                }
                onClick={onNextPage}
              >
                {ADMIN_CATALOG_COPY.PRODUCTS.PAGINATION_NEXT}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
