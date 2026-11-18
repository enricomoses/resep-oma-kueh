'use client';

import { Search } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import type {
  AdminCatalogStatus,
  AdminCategoryItem,
} from '@/types/admin-catalog';
import { cn } from '@/utils';

interface AdminProductFilterBarProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  statusFilter: '' | AdminCatalogStatus;
  onStatusChange: (status: '' | AdminCatalogStatus) => void;
  categoryFilter: string;
  onCategoryChange: (categoryId: string) => void;
  categories: AdminCategoryItem[];
  className?: string;
}

export function AdminProductFilterBar({
  searchInput,
  onSearchChange,
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  categories,
  className,
}: AdminProductFilterBarProps) {
  return (
    <Card tone="surface" className={cn('admin-prod-filter-card', className)}>
      <div className="admin-prod-filter-grid">
        <FormField label={ADMIN_CATALOG_COPY.PRODUCTS.SEARCH_LABEL}>
          {(props) => (
            <div className="admin-prod-search-wrap">
              <Search
                size={15}
                className="admin-prod-search-icon"
                aria-hidden="true"
              />
              <Input
                {...props}
                type="search"
                sizeVariant="compact"
                placeholder={ADMIN_CATALOG_COPY.PRODUCTS.SEARCH_PLACEHOLDER}
                value={searchInput}
                onChange={(event) => onSearchChange(event.target.value)}
                className="admin-prod-search-input"
              />
            </div>
          )}
        </FormField>

        <FormField label={ADMIN_CATALOG_COPY.PRODUCTS.FILTER_STATUS_LABEL}>
          {(props) => (
            <Select
              {...props}
              sizeVariant="compact"
              value={statusFilter}
              onChange={(event) =>
                onStatusChange(event.target.value as '' | AdminCatalogStatus)
              }
            >
              <option value="">
                {ADMIN_CATALOG_COPY.PRODUCTS.FILTER_STATUS_ALL}
              </option>
              <option value="draft">
                {ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS.draft}
              </option>
              <option value="published">
                {ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS.published}
              </option>
              <option value="archived">
                {ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS.archived}
              </option>
            </Select>
          )}
        </FormField>

        <FormField label={ADMIN_CATALOG_COPY.PRODUCTS.FILTER_CATEGORY_LABEL}>
          {(props) => (
            <Select
              {...props}
              sizeVariant="compact"
              value={categoryFilter}
              onChange={(event) => onCategoryChange(event.target.value)}
            >
              <option value="">
                {ADMIN_CATALOG_COPY.PRODUCTS.FILTER_CATEGORY_ALL}
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          )}
        </FormField>
      </div>
    </Card>
  );
}
