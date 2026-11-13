'use client';

import { Archive, Plus, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type {
  AdminConfigVariant,
  AdminProductType,
  AdminVariantStatus,
} from '@/types/admin-catalog';
import { cn } from '@/utils';

interface AdminProductVariantsSectionProps {
  productType: AdminProductType;
  variants: AdminConfigVariant[];
  persistedVariantIds: ReadonlySet<string>;
  branchOfferCountByVariantId: Map<string, number>;
  fieldErrors: Record<string, string[]>;
  onChange: (next: AdminConfigVariant[]) => void;
  className?: string;
}

function getStatusTone(status: AdminVariantStatus) {
  if (status === 'active') return 'success';
  if (status === 'archived') return 'neutral';
  return 'accent';
}

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
        {variants.map((variant, idx) => {
          const isPersisted = persistedVariantIds.has(variant.id);
          const offerCount = branchOfferCountByVariantId.get(variant.id) ?? 0;
          const prefix = `variants.${idx}`;

          return (
            <Card key={variant.id} className="admin-editor-item-card">
              <div className="admin-editor-item-header">
                <div className="admin-inline-actions">
                  <strong>
                    Varian #{idx + 1}: {variant.name || variant.sku}
                  </strong>
                  <Badge tone={getStatusTone(variant.status)}>
                    {variant.status}
                  </Badge>
                  {variant.isDefault ? (
                    <Badge tone="accent">Default</Badge>
                  ) : null}
                  {isPersisted ? (
                    <span className="admin-row-meta">
                      Tawaran cabang aktif: {offerCount}
                    </span>
                  ) : (
                    <Badge tone="neutral">Baru (belum disimpan)</Badge>
                  )}
                </div>

                <div className="admin-inline-actions">
                  {variant.status !== 'archived' ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSoftArchive(idx)}
                    >
                      <Archive size={14} aria-hidden="true" />
                      <span>Arsipkan Varian</span>
                    </Button>
                  ) : null}
                  {!isPersisted ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUnsaved(idx)}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      <span>Hapus Baris Baru</span>
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="admin-form-row-2">
                <FormField
                  label="Kode SKU"
                  required
                  helper={
                    isPersisted
                      ? 'SKU permanen setelah disimpan.'
                      : 'Huruf kapital, angka, strip (-), atau garis bawah (_).'
                  }
                  error={fieldErrors[`${prefix}.sku`]?.[0]}
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={variant.sku}
                      readOnly={isPersisted}
                      disabled={isPersisted}
                      onChange={(e) =>
                        updateVariant(idx, {
                          sku: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  )}
                </FormField>

                <FormField
                  label="Nama Varian"
                  required
                  error={fieldErrors[`${prefix}.name`]?.[0]}
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={variant.name}
                      onChange={(e) =>
                        updateVariant(idx, { name: e.target.value })
                      }
                    />
                  )}
                </FormField>
              </div>

              <div className="admin-form-row-3">
                <FormField
                  label="Label Ukuran / Kemasan (DB)"
                  error={fieldErrors[`${prefix}.sizeLabel`]?.[0]}
                >
                  {(props) => (
                    <Input
                      {...props}
                      placeholder="Mis. 20 cm / Box 12 slices"
                      value={variant.sizeLabel ?? ''}
                      onChange={(e) =>
                        updateVariant(idx, {
                          sizeLabel:
                            e.target.value.length > 0 ? e.target.value : null,
                        })
                      }
                    />
                  )}
                </FormField>

                <FormField
                  label="Harga Dasar (IDR)"
                  required
                  error={fieldErrors[`${prefix}.basePriceIdr`]?.[0]}
                >
                  {(props) => (
                    <Input
                      {...props}
                      type="number"
                      min={1}
                      step={1}
                      value={String(variant.basePriceIdr)}
                      onChange={(e) => {
                        const parsed = Number.parseInt(e.target.value, 10);
                        updateVariant(idx, {
                          basePriceIdr: Number.isFinite(parsed) ? parsed : 0,
                        });
                      }}
                    />
                  )}
                </FormField>

                <FormField
                  label="Status Varian"
                  required
                  error={fieldErrors[`${prefix}.status`]?.[0]}
                >
                  {(props) => (
                    <Select
                      {...props}
                      value={variant.status}
                      onChange={(e) =>
                        updateVariant(idx, {
                          status: e.target.value as AdminVariantStatus,
                        })
                      }
                    >
                      <option value="draft">Draf</option>
                      <option value="active">Aktif</option>
                      <option value="archived">Diarsipkan</option>
                    </Select>
                  )}
                </FormField>
              </div>

              <div className="admin-form-row-3">
                <FormField
                  label="Maks Qty per Pesanan"
                  required
                  error={fieldErrors[`${prefix}.maxQuantityPerOrder`]?.[0]}
                >
                  {(props) => (
                    <Input
                      {...props}
                      type="number"
                      min={1}
                      max={99}
                      value={String(variant.maxQuantityPerOrder)}
                      onChange={(e) => {
                        const parsed = Number.parseInt(e.target.value, 10);
                        updateVariant(idx, {
                          maxQuantityPerOrder: Number.isFinite(parsed)
                            ? parsed
                            : 1,
                        });
                      }}
                    />
                  )}
                </FormField>

                <FormField
                  label="Urutan Tampil"
                  required
                  error={fieldErrors[`${prefix}.sortOrder`]?.[0]}
                >
                  {(props) => (
                    <Input
                      {...props}
                      type="number"
                      min={0}
                      max={9999}
                      value={String(variant.sortOrder)}
                      onChange={(e) => {
                        const parsed = Number.parseInt(e.target.value, 10);
                        updateVariant(idx, {
                          sortOrder: Number.isFinite(parsed) ? parsed : 0,
                        });
                      }}
                    />
                  )}
                </FormField>

                <div className="admin-checkbox-align">
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      checked={variant.isDefault}
                      disabled={variant.status === 'archived'}
                      onChange={(e) =>
                        updateVariant(idx, { isDefault: e.target.checked })
                      }
                    />
                    <span>Jadikan Varian Default</span>
                  </label>
                  {fieldErrors[`${prefix}.isDefault`]?.[0] ? (
                    <p className="field-error" role="alert">
                      {fieldErrors[`${prefix}.isDefault`][0]}
                    </p>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
