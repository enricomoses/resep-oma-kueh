'use client';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import type {
  AdminConfigVariant,
  AdminProductType,
} from '@/types/admin-catalog';
import { cn } from '@/utils';

import { AdminProductVariantCard } from './admin-product-variant-card';

interface AdminProductVariantsSectionProps {
  productType: AdminProductType;
  variants: AdminConfigVariant[];
  persistedVariantIds: ReadonlySet<string>;
  branchOfferCountByVariantId: Map<string, number>;
  fieldErrors: Record<string, string[]>;
  onChange: (next: AdminConfigVariant[]) => void;
  className?: string;
}

/** Editor section managing the list of product SKU variants and their default/archive rules. */
export function AdminProductVariantsSection({
  productType,
  variants,
  persistedVariantIds,
  branchOfferCountByVariantId,
  fieldErrors,
  onChange,
  className,
}: AdminProductVariantsSectionProps) {
  function handleAddVariant() {
    const idx = variants.length + 1;
    const isFirstActive = !variants.some((v) => v.isDefault);
    const nextVariant: AdminConfigVariant = {
      id: crypto.randomUUID(),
      sku: `SKU-BARU-${idx}`,
      name: `Varian ${idx}`,
      sizeLabel: null,
      basePriceIdr: 50_000,
      status: 'draft',
      sortOrder: idx * 10,
      maxQuantityPerOrder: 99,
      isDefault: isFirstActive,
      bundleRecipe: productType === 'bundle' ? 'chiffon_mix' : null,
      bundleUnitsTotal: productType === 'bundle' ? 12 : null,
      bundleRulesVerified: false,
      fixedComponents: [],
      optionGroups: [],
      dietaryTags: [],
      allergens: [],
    };
    onChange([...variants, nextVariant]);
  }

  function updateVariant(idx: number, patch: Partial<AdminConfigVariant>) {
    const next = variants.map((variant, itemIdx) => {
      if (patch.isDefault && itemIdx !== idx) {
        return { ...variant, isDefault: false };
      }
      if (itemIdx !== idx) return variant;
      const merged = { ...variant, ...patch };
      if (merged.status === 'archived') {
        merged.isDefault = false;
      }
      return merged;
    });
    onChange(next);
  }

  function handleSoftArchive(idx: number) {
    updateVariant(idx, { status: 'archived', isDefault: false });
  }

  function handleRemoveUnsaved(idx: number) {
    const next = variants.filter((_, i) => i !== idx);
    if (
      next.length > 0 &&
      !next.some((v) => v.isDefault && v.status !== 'archived')
    ) {
      const firstActive = next.findIndex((v) => v.status !== 'archived');
      if (firstActive >= 0) {
        next[firstActive] = { ...next[firstActive], isDefault: true };
      }
    }
    onChange(next);
  }

  const sectionError = fieldErrors.variants?.[0];

  return (
    <section
      className={cn('admin-editor-section', className)}
      aria-labelledby="variants-section-heading"
    >
      <div className="admin-section-header">
        <div>
          <h3 id="variants-section-heading" className="admin-editor-heading">
            Varian SKU &amp; Harga Dasar (IDR)
          </h3>
          <p className="admin-row-meta">
            Harga diatur per varian SKU dalam bilangan bulat rupiah. SKU yang
            sudah tersimpan bersifat permanen; gunakan arsip lunak untuk
            menonaktifkan varian lama.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAddVariant}
        >
          <Plus size={15} aria-hidden="true" />
          <span>Tambah Varian SKU</span>
        </Button>
      </div>

      {sectionError ? (
        <Feedback tone="error" title={sectionError} announce />
      ) : null}

      <div className="admin-editor-stack">
        {variants.map((variant, idx) => (
          <AdminProductVariantCard
            key={variant.id}
            index={idx}
            variant={variant}
            isPersisted={persistedVariantIds.has(variant.id)}
            offerCount={branchOfferCountByVariantId.get(variant.id) ?? 0}
            fieldErrors={fieldErrors}
            onPatch={(patch) => updateVariant(idx, patch)}
            onSoftArchive={() => handleSoftArchive(idx)}
            onRemoveUnsaved={() => handleRemoveUnsaved(idx)}
          />
        ))}
      </div>
    </section>
  );
}
