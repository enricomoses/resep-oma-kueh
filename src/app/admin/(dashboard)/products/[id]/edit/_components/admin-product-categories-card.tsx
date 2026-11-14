'use client';

import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import type {
  AdminConfigCategory,
  AdminProductEditorAggregate,
} from '@/types/admin-catalog';
import { cn } from '@/utils';

interface AdminProductCategoriesCardProps {
  referenceCategories: AdminProductEditorAggregate['referenceData']['categories'];
  assignedCategories: AdminConfigCategory[];
  errorMessage?: string;
  onToggleCategory: (categoryId: string) => void;
  onSetPrimaryCategory: (categoryId: string) => void;
  className?: string;
}

export function AdminProductCategoriesCard({
  referenceCategories,
  assignedCategories,
  errorMessage,
  onToggleCategory,
  onSetPrimaryCategory,
  className,
}: AdminProductCategoriesCardProps) {
  return (
    <Card className={cn('admin-editor-item-card', className)}>
      <h3 className="admin-editor-heading">Kategori Produk</h3>
      {errorMessage ? (
        <Feedback tone="error" title={errorMessage} announce />
      ) : null}

      <div className="admin-category-assignment-grid">
        {referenceCategories.map((cat) => {
          const assigned = assignedCategories.find(
            (c) => c.categoryId === cat.id,
          );
          return (
            <div key={cat.id} className="admin-category-assignment-row">
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={Boolean(assigned)}
                  onChange={() => onToggleCategory(cat.id)}
                />
                <span>
                  {cat.name} ({cat.status})
                </span>
              </label>
              {assigned ? (
                <label className="admin-checkbox-label">
                  <input
                    type="radio"
                    name="primary-category"
                    checked={assigned.isPrimary}
                    onChange={() => onSetPrimaryCategory(cat.id)}
                  />
                  <span>Utama</span>
                </label>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
