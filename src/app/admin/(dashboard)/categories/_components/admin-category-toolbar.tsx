import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import type { AdminCatalogStatus } from '@/types/admin-catalog';
import { cn } from '@/utils';

export type CategoryStatusFilter = 'all' | AdminCatalogStatus;

interface CategoryStatusCounts {
  all: number;
  published: number;
  draft: number;
  archived: number;
}

interface AdminCategoryToolbarProps {
  statusFilter: CategoryStatusFilter;
  onStatusFilterChange: (next: CategoryStatusFilter) => void;
  searchQuery: string;
  onSearchQueryChange: (next: string) => void;
  counts: CategoryStatusCounts;
  className?: string;
}

export function AdminCategoryToolbar({
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  counts,
  className,
}: AdminCategoryToolbarProps) {
  const tabs: { id: CategoryStatusFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Semua', count: counts.all },
    {
      id: 'published',
      label: ADMIN_CATALOG_COPY.CATEGORIES.STATUS_LABELS.published,
      count: counts.published,
    },
    {
      id: 'draft',
      label: ADMIN_CATALOG_COPY.CATEGORIES.STATUS_LABELS.draft,
      count: counts.draft,
    },
    {
      id: 'archived',
      label: ADMIN_CATALOG_COPY.CATEGORIES.STATUS_LABELS.archived,
      count: counts.archived,
    },
  ];

  return (
    <div className={cn('admin-cat-toolbar', className)}>
      <div
        className="admin-cat-tabs"
        role="tablist"
        aria-label="Filter status kategori"
      >
        {tabs.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={cn(
                'admin-cat-tab',
                isActive && 'admin-cat-tab--active',
              )}
              onClick={() => onStatusFilterChange(tab.id)}
            >
              <span>{tab.label}</span>
              <span className="admin-cat-tab-count">{tab.count}</span>
            </button>
          );
        })}
      </div>

      <div className="admin-cat-search-wrap">
        <Search
          size={15}
          className="admin-cat-search-icon"
          aria-hidden="true"
        />
        <Input
          type="search"
          sizeVariant="compact"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Cari nama atau slug..."
          aria-label="Cari kategori"
          className="admin-cat-search-input"
        />
      </div>
    </div>
  );
}
