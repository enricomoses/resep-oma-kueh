'use client';

import type { Dispatch, SetStateAction } from 'react';

import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import type { ProgramFormState } from '@/types/classes';

interface AdminClassProgramMetricsFieldsProps {
  form: ProgramFormState;
  setForm: Dispatch<SetStateAction<ProgramFormState>>;
  fieldErrors: Record<string, string[]>;
}

/** Four-column numeric inputs for class base price, age bounds, and session duration. */
export function AdminClassProgramMetricsFields({
  form,
  setForm,
  fieldErrors,
}: AdminClassProgramMetricsFieldsProps) {
  return (
    <div className="admin-form-grid-4">
      <FormField
        id="class-program-price"
        label="Harga Dasar (IDR)"
        error={fieldErrors.basePriceIdr?.[0]}
      >
        {(fieldProps) => (
          <Input
            {...fieldProps}
            type="number"
            min={1000}
            step={1000}
            value={form.basePriceIdr}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                basePriceIdr: event.target.value,
              }))
            }
          />
        )}
      </FormField>

      <FormField
        id="class-program-age-min"
        label="Usia Min (Tahun)"
        error={fieldErrors.ageMin?.[0]}
      >
        {(fieldProps) => (
          <Input
            {...fieldProps}
            type="number"
            min={1}
            max={99}
            value={form.ageMin}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, ageMin: event.target.value }))
            }
          />
        )}
      </FormField>

      <FormField
        id="class-program-age-max"
        label="Usia Maks (Tahun)"
        error={fieldErrors.ageMax?.[0]}
      >
        {(fieldProps) => (
          <Input
            {...fieldProps}
            type="number"
            min={1}
            max={99}
            value={form.ageMax}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, ageMax: event.target.value }))
            }
          />
        )}
      </FormField>

      <FormField
        id="class-program-duration"
        label="Durasi (Menit)"
        error={fieldErrors.durationMinutes?.[0]}
      >
        {(fieldProps) => (
          <Input
            {...fieldProps}
            type="number"
            min={15}
            max={720}
            value={form.durationMinutes}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                durationMinutes: event.target.value,
              }))
            }
          />
        )}
      </FormField>
    </div>
  );
}
