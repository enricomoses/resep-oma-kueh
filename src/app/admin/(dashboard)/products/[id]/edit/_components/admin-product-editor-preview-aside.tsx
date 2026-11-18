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
      <Card tone="surface" className="admin-editor-preview-card">
        <h3 className="admin-editor-heading">
          {ADMIN_CATALOG_COPY.PRODUCT_EDITOR.PREVIEW_HEADING}
        </h3>
        <MenuProductCard
          product={product}
          previewImageUrl={previewImageUrl}
          hasBranchSelected
          branchCode="surabaya"
        />
      </Card>
    </aside>
  );
}
