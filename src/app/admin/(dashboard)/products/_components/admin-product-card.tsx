'use client';

import { AlertCircle, Archive, Pencil, SlidersHorizontal } from 'lucide-react';

import { ActionLink } from '@/components/ui/action-link';
import { Button } from '@/components/ui/button';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import type { AdminProductItem } from '@/types/admin-catalog';
import { cn } from '@/utils';
import { buildAdminProductEditRoute } from '@/utils/admin-catalog';

interface AdminProductCardProps {
  product: AdminProductItem;
  onEdit: (product: AdminProductItem) => void;
  onArchive: (product: AdminProductItem) => void;
  className?: string;
}

export function AdminProductCard({
  product,
  onEdit,
  onArchive,
  className,
}: AdminProductCardProps) {
  return (
    <li className={cn('admin-prod-row', className)}>
      <div className="admin-prod-primary">
        <div className="admin-prod-name-line">
          <h3 className="admin-prod-name admin-wrap-text">{product.name}</h3>
          <code className="admin-prod-slug">{product.slug}</code>
          {product.needsOwnerReview ? (
            <span className="admin-prod-review-flag">
              <AlertCircle size={13} aria-hidden="true" />
              <span>Perlu Review</span>
            </span>
          ) : null}
        </div>

        {product.categories.length > 0 ? (
          <p className="admin-prod-categories admin-wrap-text">
            {product.categories.map((cat) => cat.name).join(' · ')}
          </p>
        ) : null}

        {product.shortDescription ? (
          <p className="admin-prod-desc admin-wrap-text">
            {product.shortDescription}
          </p>
        ) : null}
      </div>

      <div className="admin-prod-meta-inline">
        <p className="admin-prod-type">
          <span className="admin-prod-cell-label">Tipe:</span>
          {ADMIN_CATALOG_COPY.PRODUCTS.TYPE_LABELS[product.productType]}
        </p>

        <p
          className={cn(
            'admin-prod-status',
            `admin-prod-status--${product.status}`,
          )}
        >
          <span className="admin-prod-status-dot" aria-hidden="true" />
          <span>
            {ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS[product.status]}
          </span>
        </p>

        <p className="admin-prod-stats">
          <span className="admin-prod-cell-label">Varian &amp; Urutan:</span>
          <strong>{product.readiness.activeVariantCount}</strong> varian · #
          {product.sortOrder}
        </p>
      </div>

      <div className="admin-prod-actions">
        <ActionLink
          href={buildAdminProductEditRoute(product.id)}
          variant="secondary"
          size="sm"
        >
          <SlidersHorizontal size={14} aria-hidden="true" />
          <span>{ADMIN_CATALOG_COPY.PRODUCT_EDITOR.OPEN_EDITOR_BTN}</span>
        </ActionLink>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEdit(product)}
        >
          <Pencil size={14} aria-hidden="true" />
          <span>{ADMIN_CATALOG_COPY.PRODUCTS.EDIT_BTN}</span>
        </Button>
        {product.status !== 'archived' ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onArchive(product)}
          >
            <Archive size={14} aria-hidden="true" />
            <span>{ADMIN_CATALOG_COPY.PRODUCTS.ARCHIVE_BTN}</span>
          </Button>
        ) : null}
      </div>
    </li>
  );
}
