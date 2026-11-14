'use client';

import type { Dispatch, SetStateAction } from 'react';

import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import {
  PROMOTION_COPY,
  PROMOTION_SCOPES,
} from '@/constants/promotion.constant';
import type {
  AdminPromotionReferenceOptions,
  PromotionFormState,
  PromotionScope,
} from '@/types/promotion';
import { togglePromotionTargetId } from '@/utils/admin-promotions';

import { AdminPromotionScopeTargets } from './admin-promotion-scope-targets';

interface AdminPromotionScopeSectionProps {
  formState: PromotionFormState;
  fieldErrors: Record<string, string[]>;
  references: AdminPromotionReferenceOptions;
  onChange: Dispatch<SetStateAction<PromotionFormState>>;
}

/** Scope selector and targeted category/product/variant checklist for a promotion. */
export function AdminPromotionScopeSection({
  formState,
  fieldErrors,
  references,
  onChange,
}: AdminPromotionScopeSectionProps) {
  return (
    <div className="space-y-3 border-t border-[var(--border-sand)] pt-4">
      <FormField
        id="promo-scope"
        label="Target Scope Promosi"
        error={
          fieldErrors.scope?.[0] ??
          fieldErrors.targets?.[0] ??
          fieldErrors.categoryIds?.[0] ??
          fieldErrors.productIds?.[0] ??
          fieldErrors.variantIds?.[0]
        }
      >
        {(fieldProps) => (
          <Select
            {...fieldProps}
            value={formState.scope}
            onChange={(e) => {
              const nextScope = e.target.value as PromotionScope;
              onChange((prev) => ({
                ...prev,
                scope: nextScope,
                categoryIds: nextScope === 'category' ? prev.categoryIds : [],
                productIds: nextScope === 'product' ? prev.productIds : [],
                variantIds: nextScope === 'variant' ? prev.variantIds : [],
              }));
            }}
          >
            {PROMOTION_SCOPES.map((scope) => (
              <option key={scope} value={scope}>
                {PROMOTION_COPY.SCOPE_LABELS[scope]}
              </option>
            ))}
          </Select>
        )}
      </FormField>

      {formState.scope === 'category' ? (
        <AdminPromotionScopeTargets
          items={references.categories}
          selectedIds={formState.categoryIds}
          emptyText="Belum ada kategori tersedia."
          onToggle={(id) =>
            onChange((prev) => ({
              ...prev,
              categoryIds: togglePromotionTargetId(prev.categoryIds, id),
            }))
          }
        />
      ) : null}

      {formState.scope === 'product' ? (
        <AdminPromotionScopeTargets
          items={references.products}
          selectedIds={formState.productIds}
          emptyText="Belum ada produk tersedia."
          onToggle={(id) =>
            onChange((prev) => ({
              ...prev,
              productIds: togglePromotionTargetId(prev.productIds, id),
            }))
          }
        />
      ) : null}

      {formState.scope === 'variant' ? (
        <AdminPromotionScopeTargets
          items={references.variants}
          selectedIds={formState.variantIds}
          emptyText="Belum ada varian SKU tersedia."
          onToggle={(id) =>
            onChange((prev) => ({
              ...prev,
              variantIds: togglePromotionTargetId(prev.variantIds, id),
            }))
          }
        />
      ) : null}
    </div>
  );
}
