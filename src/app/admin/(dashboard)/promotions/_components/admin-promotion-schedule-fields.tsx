'use client';

import type { Dispatch, SetStateAction } from 'react';

import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { PROMOTION_STATUSES } from '@/constants/promotion.constant';
import type { PromotionFormState, PromotionStatus } from '@/types/promotion';

interface AdminPromotionScheduleFieldsProps {
  formState: PromotionFormState;
  fieldErrors: Record<string, string[]>;
  onChange: Dispatch<SetStateAction<PromotionFormState>>;
}

/** Schedule window, priority, and publication status grid for a promotion form. */
export function AdminPromotionScheduleFields({
  formState,
  fieldErrors,
  onChange,
}: AdminPromotionScheduleFieldsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <FormField
        id="promo-starts-at"
        label="Mulai (WIB / Jakarta)"
        error={fieldErrors.startsAt?.[0]}
      >
        {(fieldProps) => (
          <Input
            {...fieldProps}
            type="datetime-local"
            value={formState.startsAtLocal}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                startsAtLocal: e.target.value,
              }))
            }
          />
        )}
      </FormField>

      <FormField
        id="promo-ends-at"
        label="Berakhir Eksklusif (WIB / Jakarta)"
        error={fieldErrors.endsAt?.[0]}
      >
        {(fieldProps) => (
          <Input
            {...fieldProps}
            type="datetime-local"
            value={formState.endsAtLocal}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                endsAtLocal: e.target.value,
              }))
            }
          />
        )}
      </FormField>

      <FormField
        id="promo-priority"
        label="Prioritas Seri (Angka)"
        error={fieldErrors.priority?.[0]}
      >
        {(fieldProps) => (
          <Input
            {...fieldProps}
            type="number"
            step="1"
            value={formState.priority}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, priority: e.target.value }))
            }
          />
        )}
      </FormField>

      <FormField
        id="promo-status"
        label="Status Publikasi"
        error={fieldErrors.status?.[0]}
      >
        {(fieldProps) => (
          <Select
            {...fieldProps}
            value={formState.status}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                status: e.target.value as PromotionStatus,
              }))
            }
          >
            {PROMOTION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        )}
      </FormField>
    </div>
  );
}
