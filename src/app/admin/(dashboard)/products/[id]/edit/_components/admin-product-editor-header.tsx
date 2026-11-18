'use client';

import { ArrowLeft, RefreshCw } from 'lucide-react';

import { StatusIndicator } from '@/components/common/status/status-indicator';
import { ActionLink } from '@/components/ui/action-link';
import { Button } from '@/components/ui/button';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import type { AdminCatalogStatus } from '@/types/admin-catalog';
import { cn } from '@/utils';
import { formatJakartaDateTimeDisplay } from '@/utils/admin-promotions';

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
  const statusTone =
    status === 'published'
      ? 'success'
      : status === 'archived'
        ? 'neutral'
        : 'accent';

  return (
    <div className={cn('admin-editor-header', className)}>
      <div className="admin-editor-header-main">
        <ActionLink
          href={ROUTES.ADMIN_PRODUCTS}
          variant="ghost"
          size="sm"
          className="admin-editor-back-link"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          <span>{ADMIN_CATALOG_COPY.PRODUCT_EDITOR.BACK_TO_PRODUCTS}</span>
        </ActionLink>

        <div className="admin-editor-title-row">
          <h2 className="admin-section-title admin-wrap-text">
            {ADMIN_CATALOG_COPY.PRODUCT_EDITOR.EDIT_PAGE_TITLE}: {productName}
          </h2>
          <StatusIndicator
            tone={statusTone}
            label={ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS[status]}
          />
        </div>

        <p className="admin-editor-meta">
          Slug permanen:{' '}
          <code className="admin-editor-slug">{productSlug}</code> · Terakhir
          diperbarui:{' '}
          <span>{formatJakartaDateTimeDisplay(expectedUpdatedAt)}</span>
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
