'use client';

import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type {
  AdminConfigFixedComponent,
  AdminReferenceComponentVariant,
} from '@/types/admin-catalog';

interface AdminProductBundleFixedListProps {
  errorPrefix: string;
  fixedComponents: AdminConfigFixedComponent[];
  eligibleComponents: AdminReferenceComponentVariant[];
  fieldErrors: Record<string, string[]>;
  onChange: (nextFixed: AdminConfigFixedComponent[]) => void;
}

/** Subsection for configuring fixed bundle components (Cheese & Choco slots). */
export function AdminProductBundleFixedList({
  errorPrefix,
  fixedComponents,
  eligibleComponents,
  fieldErrors,
  onChange,
}: AdminProductBundleFixedListProps) {
  function handleAddFixed() {
    const nextFixed: AdminConfigFixedComponent = {
      id: crypto.randomUUID(),
      componentVariantId: eligibleComponents[0]?.id ?? '',
      componentSlot: fixedComponents.some((f) => f.componentSlot === 'cheese')
        ? 'choco'
        : 'cheese',
      quantity: 3,
      sortOrder: (fixedComponents.length + 1) * 10,
    };
    onChange([...fixedComponents, nextFixed]);
  }

  function updateFixedAt(
    idx: number,
    patch: Partial<AdminConfigFixedComponent>,
  ) {
    onChange(
      fixedComponents.map((item, i) =>
        i === idx ? { ...item, ...patch } : item,
      ),
    );
  }

  return (
    <div className="admin-editor-subsection">
      <div className="admin-section-header">
        <strong>Komponen Tetap (Fixed: Cheese 3 + Choco 3)</strong>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAddFixed}
        >
          <Plus size={14} aria-hidden="true" />
          <span>Tambah Komponen Tetap</span>
        </Button>
      </div>

      {fixedComponents.map((fixed, fIdx) => (
        <div key={fixed.id} className="admin-form-row-3">
          <FormField
            label="Slot"
            error={
              fieldErrors[
                `${errorPrefix}.fixedComponents.${fIdx}.componentSlot`
              ]?.[0]
            }
          >
            {(props) => (
              <Select
                {...props}
                value={fixed.componentSlot}
                onChange={(e) =>
                  updateFixedAt(fIdx, {
                    componentSlot: e.target.value as 'cheese' | 'choco',
                  })
                }
              >
                <option value="cheese">Cheese</option>
                <option value="choco">Choco</option>
              </Select>
            )}
          </FormField>

          <FormField
            label="Varian Komponen"
            error={
              fieldErrors[
                `${errorPrefix}.fixedComponents.${fIdx}.componentVariantId`
              ]?.[0]
            }
          >
            {(props) => (
              <Select
                {...props}
                value={fixed.componentVariantId}
                onChange={(e) =>
                  updateFixedAt(fIdx, { componentVariantId: e.target.value })
                }
              >
                <option value="">Pilih komponen...</option>
                {eligibleComponents.map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    {cv.productName} · {cv.variantName} ({cv.sku})
                    {cv.isGlutenFreeVerified ? ' [GF]' : ''}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <div className="admin-inline-actions">
            <FormField
              label="Qty"
              error={
                fieldErrors[
                  `${errorPrefix}.fixedComponents.${fIdx}.quantity`
                ]?.[0]
              }
            >
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min={1}
                  max={99}
                  value={String(fixed.quantity)}
                  onChange={(e) => {
                    const val = Number.parseInt(e.target.value, 10);
                    updateFixedAt(fIdx, {
                      quantity: Number.isFinite(val) ? val : 1,
                    });
                  }}
                />
              )}
            </FormField>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Hapus komponen tetap"
              onClick={() =>
                onChange(fixedComponents.filter((_, i) => i !== fIdx))
              }
            >
              <Trash2 size={14} aria-hidden="true" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
