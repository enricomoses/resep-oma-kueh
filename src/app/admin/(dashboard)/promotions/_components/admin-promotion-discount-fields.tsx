'use client';

import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  PROMOTION_COPY,
  PROMOTION_DISCOUNT_TYPES,
} from '@/constants/promotion.constant';
import type { PromotionFormState } from '@/types/promotion';

interface AdminPromotionDiscountFieldsProps {
  formState: PromotionFormState;
  fieldErrors: Record<string, string[]>;
  onChange: (updater: (prev: PromotionFormState) => PromotionFormState) => void;
}

/** 4-column grid of discount type, amount, min spend, and max discount cap inputs. */
export function AdminPromotionDiscountFields({
  formState,
  fieldErrors,
  onChange,
}: AdminPromotionDiscountFieldsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <FormField
        id="promo-discount-type"
        label="Tipe Diskon"
        error={fieldErrors.discountType?.[0]}
      >
        {(fieldProps) => (
          <Select
            {...fieldProps}
            value={formState.discountType}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                discountType:
                  e.target.value === 'fixed' ? 'fixed' : 'percentage',
              }))
            }
          >
            {PROMOTION_DISCOUNT_TYPES.map((type) => (
              <option key={type} value={type}>
                {PROMOTION_COPY.DISCOUNT_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        )}
      </FormField>

      <FormField
        id="promo-discount-value"
        label={
          formState.discountType === 'percentage'
            ? 'Persentase (%)'
            : 'Potongan per Unit (Rp)'
        }
        error={fieldErrors.discountValue?.[0]}
      >
        {(fieldProps) => (
          <Input
            {...fieldProps}
            type="number"
            step={formState.discountType === 'percentage' ? '0.01' : '1'}
            min="0"
            value={formState.discountValue}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, discountValue: e.target.value }))
            }
          />
        )}
      </FormField>

      <FormField
        id="promo-min-spend"
        label="Min. Belanja Eligible (Rp)"
        error={fieldErrors.minSpendIdr?.[0]}
      >
        {(fieldProps) => (
          <Input
            {...fieldProps}
            type="number"
            min="0"
            step="1"
            value={formState.minSpendIdr}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, minSpendIdr: e.target.value }))
            }
          />
        )}
      </FormField>

      <FormField
        id="promo-max-discount"
        label="Maks. Potongan / Baris (Rp, Opsional)"
        error={fieldErrors.maxDiscountIdr?.[0]}
      >
        {(fieldProps) => (
          <Input
            {...fieldProps}
            type="number"
            min="0"
            step="1"
            value={formState.maxDiscountIdr}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, maxDiscountIdr: e.target.value }))
            }
            placeholder="Tanpa batas"
          />
        )}
      </FormField>
    </div>
  );
}
