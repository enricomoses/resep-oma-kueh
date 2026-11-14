import { Archive, CheckCircle2, Pencil } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import type {
  AdminCatalogStatus,
  AdminCategoryItem,
} from '@/types/admin-catalog';
import { cn } from '@/utils';

function getStatusBadgeTone(status: AdminCatalogStatus) {
  if (status === 'published') return 'success';
  if (status === 'archived') return 'neutral';
  return 'accent';
}

interface AdminCategoryCardProps {
  category: AdminCategoryItem;
  isPublishing: boolean;
  onEdit: (category: AdminCategoryItem) => void;
  onQuickPublish: (category: AdminCategoryItem) => void;
  onRequestArchive: (category: AdminCategoryItem) => void;
  className?: string;
}

export function AdminCategoryCard({
  category,
  isPublishing,
  onEdit,
  onQuickPublish,
  onRequestArchive,
  className,
}: AdminCategoryCardProps) {
  const hasRefs = category.childCount > 0 || category.productRefCount > 0;

  return (
    <Card tone="surface" className={cn('admin-row-card', className)}>
      <div className="admin-row-main">
        <div className="admin-row-title-row">
          <h3 className="admin-row-title admin-wrap-text">{category.name}</h3>
          <Badge tone={getStatusBadgeTone(category.status)}>
            {ADMIN_CATALOG_COPY.CATEGORIES.STATUS_LABELS[category.status]}
          </Badge>
          <Badge tone="neutral">Urutan {category.sortOrder}</Badge>
        </div>
        <p className="admin-row-meta admin-wrap-text">
          Slug: <code>{category.slug}</code>
          {category.parentName
            ? ` · ${ADMIN_CATALOG_COPY.CATEGORIES.PARENT_PREFIX} ${category.parentName}`
            : ''}
        </p>
        {category.description ? (
          <p className="admin-row-desc admin-wrap-text">
            {category.description}
          </p>
        ) : null}
        <p className="admin-row-meta">
          {ADMIN_CATALOG_COPY.CATEGORIES.REFS_PREFIX}{' '}
          {hasRefs
            ? `${category.childCount} subkategori, ${category.productRefCount} produk`
            : ADMIN_CATALOG_COPY.CATEGORIES.REFS_NONE}
        </p>
      </div>

      <div className="admin-row-actions">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onEdit(category)}
        >
          <Pencil size={15} aria-hidden="true" />
          <span>{ADMIN_CATALOG_COPY.CATEGORIES.EDIT_BTN}</span>
        </Button>
        {category.status === 'draft' ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={isPublishing}
            onClick={() => onQuickPublish(category)}
          >
            <CheckCircle2 size={15} aria-hidden="true" />
            <span>{ADMIN_CATALOG_COPY.CATEGORIES.PUBLISH_BTN}</span>
          </Button>
        ) : null}
        {category.status !== 'archived' ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRequestArchive(category)}
          >
            <Archive size={15} aria-hidden="true" />
            <span>{ADMIN_CATALOG_COPY.CATEGORIES.ARCHIVE_BTN}</span>
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
