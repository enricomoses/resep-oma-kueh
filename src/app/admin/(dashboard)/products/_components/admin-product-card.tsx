'use client';

import { Archive, Pencil, SlidersHorizontal } from 'lucide-react';

import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import type {
  AdminCatalogStatus,
  AdminProductItem,
} from '@/types/admin-catalog';
import { cn } from '@/utils';
import { buildAdminProductEditRoute } from '@/utils/admin-catalog';

interface AdminProductCardProps {
  product: AdminProductItem;
  onEdit: (product: AdminProductItem) => void;
  onArchive: (product: AdminProductItem) => void;
  className?: string;
}

function getStatusBadgeTone(status: AdminCatalogStatus) {
  if (status === 'published') return 'success';
  if (status === 'archived') return 'neutral';
  return 'accent';
}

export function AdminProductCard({
  product,
  onEdit,
  onArchive,
  className,
}: AdminProductCardProps) {
  return (
    <Card tone="surface" className={cn('admin-row-card', className)}>
      <div className="admin-row-main">
        <div className="admin-row-title-row">
          <h3 className="admin-row-title admin-wrap-text">{product.name}</h3>
          <Badge tone={getStatusBadgeTone(product.status)}>
            {ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS[product.status]}
          </Badge>
          <Badge tone="neutral">
            {ADMIN_CATALOG_COPY.PRODUCTS.TYPE_LABELS[product.productType]}
          </Badge>
          {product.needsOwnerReview ? (
            <Badge tone="accent">Perlu Review</Badge>
          ) : null}
        </div>
        <p className="admin-row-meta admin-wrap-text">
          Slug: <code>{product.slug}</code> · Urutan: {product.sortOrder} ·
          Varian aktif: {product.readiness.activeVariantCount}
        </p>
        {product.categories.length > 0 ? (
          <p className="admin-row-meta admin-wrap-text">
            Kategori: {product.categories.map((cat) => cat.name).join(', ')}
          </p>
        ) : null}
        {product.shortDescription ? (
          <p className="admin-row-desc admin-wrap-text">
            {product.shortDescription}
          </p>
        ) : null}
      </div>

      <div className="admin-row-actions">
        <ActionLink
          href={buildAdminProductEditRoute(product.id)}
          variant="primary"
          size="sm"
        >
          <SlidersHorizontal size={15} aria-hidden="true" />
          <span>{ADMIN_CATALOG_COPY.PRODUCT_EDITOR.OPEN_EDITOR_BTN}</span>
        </ActionLink>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onEdit(product)}
        >
          <Pencil size={15} aria-hidden="true" />
          <span>{ADMIN_CATALOG_COPY.PRODUCTS.EDIT_BTN}</span>
        </Button>
        {product.status !== 'archived' ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onArchive(product)}
          >
            <Archive size={15} aria-hidden="true" />
            <span>{ADMIN_CATALOG_COPY.PRODUCTS.ARCHIVE_BTN}</span>
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
