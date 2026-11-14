'use client';

import { ArrowLeft, RefreshCw } from 'lucide-react';

import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import type { AdminCatalogStatus } from '@/types/admin-catalog';
import { cn } from '@/utils';

interface AdminProductEditorHeaderProps {
  productName: string;
  productSlug: string;
  status: AdminCatalogStatus;
  expectedUpdatedAt: string;
  isFetching: boolean;
  onReloadLatest: () => void;
  className?: string;
}

/** Header bar for the admin product configuration editor. */
export function AdminProductEditorHeader({
  productName,
  productSlug,
  status,
  expectedUpdatedAt,
  isFetching,
  onReloadLatest,
  className,
}: AdminProductEditorHeaderProps) {
  return (
    <div className={cn('admin-section-header', className)}>
      <div>
        <ActionLink href={ROUTES.ADMIN_PRODUCTS} variant="ghost" size="sm">
          <ArrowLeft size={15} aria-hidden="true" />
          <span>{ADMIN_CATALOG_COPY.PRODUCT_EDITOR.BACK_TO_PRODUCTS}</span>
        </ActionLink>
        <div className="admin-inline-actions">
          <h2 className="admin-section-title">
            {ADMIN_CATALOG_COPY.PRODUCT_EDITOR.EDIT_PAGE_TITLE}: {productName}
          </h2>
          <Badge
            tone={
              status === 'published'
                ? 'success'
                : status === 'archived'
                  ? 'neutral'
                  : 'accent'
            }
          >
            {ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS[status]}
          </Badge>
        </div>
        <p className="admin-row-meta">
          Slug permanen: <code>{productSlug}</code> · Terakhir diperbarui:{' '}
          <code>{expectedUpdatedAt}</code>
        </p>
      </div>

      <div className="admin-inline-actions">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={isFetching}
          loadingLabel="Memuat..."
          onClick={onReloadLatest}
        >
          <RefreshCw size={15} aria-hidden="true" />
          <span>
            {ADMIN_CATALOG_COPY.PRODUCT_EDITOR.CONCURRENCY_CONFLICT_ACTION}
          </span>
        </Button>
      </div>
    </div>
  );
}
