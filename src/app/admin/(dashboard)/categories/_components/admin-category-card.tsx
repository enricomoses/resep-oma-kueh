import { Archive, CheckCircle2, CornerDownRight, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import type { AdminCategoryItem } from '@/types/admin-catalog';
import { cn } from '@/utils';

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
    <li className={cn('admin-cat-row', className)}>
      <div className="admin-cat-primary">
        <div className="admin-cat-name-line">
          <h3 className="admin-cat-name admin-wrap-text">{category.name}</h3>
          <code className="admin-cat-slug">{category.slug}</code>
        </div>

        {category.parentName ? (
          <p className="admin-cat-parent admin-wrap-text">
            <CornerDownRight size={13} aria-hidden="true" />
            <span>
              {ADMIN_CATALOG_COPY.CATEGORIES.PARENT_PREFIX}{' '}
              {category.parentName}
            </span>
          </p>
        ) : null}

        {category.description ? (
          <p className="admin-cat-desc admin-wrap-text">
            {category.description}
          </p>
        ) : null}
      </div>

      <div className="admin-cat-meta-inline">
        <p
          className={cn(
            'admin-cat-status',
            `admin-cat-status--${category.status}`,
          )}
        >
          <span className="admin-cat-status-dot" aria-hidden="true" />
          <span>
            {ADMIN_CATALOG_COPY.CATEGORIES.STATUS_LABELS[category.status]}
          </span>
        </p>

        <p className="admin-cat-sort">
          <span className="admin-cat-cell-label">Urutan:</span>#
          {category.sortOrder}
        </p>

        <p className="admin-cat-refs">
          <span className="admin-cat-cell-label">
            {ADMIN_CATALOG_COPY.CATEGORIES.REFS_PREFIX}
          </span>
          {hasRefs
            ? `${category.childCount} sub · ${category.productRefCount} produk`
            : ADMIN_CATALOG_COPY.CATEGORIES.REFS_NONE}
        </p>
      </div>

      <div className="admin-cat-actions">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onEdit(category)}
        >
          <Pencil size={14} aria-hidden="true" />
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
            <CheckCircle2 size={14} aria-hidden="true" />
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
            <Archive size={14} aria-hidden="true" />
            <span>{ADMIN_CATALOG_COPY.CATEGORIES.ARCHIVE_BTN}</span>
          </Button>
        ) : null}
      </div>
    </li>
  );
}
