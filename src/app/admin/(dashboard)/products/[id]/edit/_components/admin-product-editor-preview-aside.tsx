'use client';

import { MenuProductCard } from '@/components/common/commerce/menu-product-card';
import { Card } from '@/components/ui/card';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import type { CatalogProductItem } from '@/types/catalog';
import { cn } from '@/utils';

interface AdminProductEditorPreviewAsideProps {
  product: CatalogProductItem;
  previewImageUrl: string | null;
  className?: string;
}

export function AdminProductEditorPreviewAside({
  product,
  previewImageUrl,
  className,
}: AdminProductEditorPreviewAsideProps) {
  return (
    <aside
      className={cn('admin-editor-preview-aside', className)}
      aria-label={ADMIN_CATALOG_COPY.PRODUCT_EDITOR.PREVIEW_HEADING}
    >
      <Card tone="cream" className="admin-editor-preview-card">
        <h3 className="admin-editor-heading">
          {ADMIN_CATALOG_COPY.PRODUCT_EDITOR.PREVIEW_HEADING}
        </h3>
        <p className="admin-row-meta">
          {ADMIN_CATALOG_COPY.PRODUCT_EDITOR.PREVIEW_SUBTITLE}
        </p>
        <MenuProductCard
          product={product}
          previewImageUrl={previewImageUrl}
          hasBranchSelected
          branchCode="surabaya"
        />
        <p className="admin-row-meta">
          {ADMIN_CATALOG_COPY.PRODUCT_EDITOR.PREVIEW_NO_BRANCH_NOTE}
        </p>
      </Card>
    </aside>
  );
}
