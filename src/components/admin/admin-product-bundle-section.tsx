'use client';

import { Plus, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ADMIN_CATALOG_LIMITS } from '@/constants/admin-catalog.constant';
import type {
  AdminConfigFixedComponent,
  AdminConfigOptionChoice,
  AdminConfigOptionGroup,
  AdminConfigVariant,
  AdminReferenceComponentVariant,
} from '@/types/admin-catalog';
import { cn } from '@/utils';

interface AdminProductBundleSectionProps {
  productId: string;
  variants: AdminConfigVariant[];
  componentVariants: AdminReferenceComponentVariant[];
  fieldErrors: Record<string, string[]>;
  onChangeVariant: (
    variantIndex: number,
    nextVariant: AdminConfigVariant,
  ) => void;
  className?: string;
}

export function AdminProductBundleSection({
  productId,
  variants,
  componentVariants,
  fieldErrors,
  onChangeVariant,
  className,
}: AdminProductBundleSectionProps) {
  const eligibleComponents = componentVariants.filter(
    (cv) =>
      cv.productId !== productId &&
      cv.productType !== 'bundle' &&
      cv.status === 'active',
  );

  function initializeDefaultChiffonMix(variantIndex: number) {
    const variant = variants[variantIndex];
    const firstId = eligibleComponents[0]?.id ?? '';
    const secondId = eligibleComponents[1]?.id ?? firstId;

    const fixedComponents: AdminConfigFixedComponent[] = [
      {
        id: crypto.randomUUID(),
        componentVariantId: firstId,
        componentSlot: 'cheese',
        quantity: ADMIN_CATALOG_LIMITS.CHIFFON_GROUP_SELECTION_QTY,
        sortOrder: 10,
      },
      {
        id: crypto.randomUUID(),
        componentVariantId: secondId,
        componentSlot: 'choco',
        quantity: ADMIN_CATALOG_LIMITS.CHIFFON_GROUP_SELECTION_QTY,
        sortOrder: 20,
      },
    ];

    const optionGroups: AdminConfigOptionGroup[] = [
      {
        id: crypto.randomUUID(),
        name: 'Pilihan Rasa ke-3 (3 Potong)',
        minSelect: 1,
        maxSelect: 1,
        quantityPerSelection: ADMIN_CATALOG_LIMITS.CHIFFON_GROUP_SELECTION_QTY,
        sortOrder: 10,
        isRequired: true,
        choices: [],
      },
      {
        id: crypto.randomUUID(),
        name: 'Pilihan Rasa ke-4 (3 Potong)',
        minSelect: 1,
        maxSelect: 1,
        quantityPerSelection: ADMIN_CATALOG_LIMITS.CHIFFON_GROUP_SELECTION_QTY,
        sortOrder: 20,
        isRequired: true,
        choices: [],
      },
    ];

    onChangeVariant(variantIndex, {
      ...variant,
      bundleRecipe: 'chiffon_mix',
      bundleUnitsTotal: ADMIN_CATALOG_LIMITS.CHIFFON_TOTAL_UNITS,
      fixedComponents,
      optionGroups,
    });
  }

  return (
    <section
      className={cn('admin-editor-section', className)}
      aria-labelledby="bundle-section-heading"
    >
      <div>
        <h3 id="bundle-section-heading" className="admin-editor-heading">
          Komposisi Paket Chiffon Slice Mix (12 Potong)
        </h3>
        <p className="admin-row-meta">
          Atur komponen tetap Cheese (3) + Choco (3) serta 2 grup pilihan (1
          rasa × 3 potong tiap grup) yang merujuk SKU aktif produk lain.
        </p>
      </div>

      {variants.map((variant, vIdx) => {
        const prefix = `variants.${vIdx}`;

        return (
          <Card key={variant.id} className="admin-editor-item-card">
            <div className="admin-editor-item-header">
              <div className="admin-inline-actions">
                <strong>
                  Aturan Paket: {variant.name} ({variant.sku})
                </strong>
                <Badge
                  tone={variant.bundleRulesVerified ? 'success' : 'accent'}
                >
                  {variant.bundleRulesVerified
                    ? 'Aturan Terverifikasi'
                    : 'Draf / Belum Terverifikasi'}
                </Badge>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => initializeDefaultChiffonMix(vIdx)}
              >
                Isi Template 12-Potong (2 Tetap + 2 Grup)
              </Button>
            </div>

            {fieldErrors[`${prefix}.bundleRulesVerified`]?.[0] ? (
              <Feedback
                tone="error"
                title={fieldErrors[`${prefix}.bundleRulesVerified`][0]}
                announce
              />
            ) : null}

            <div className="admin-form-row-3">
              <FormField
                label="Resep Paket"
                error={fieldErrors[`${prefix}.bundleRecipe`]?.[0]}
              >
                {(props) => (
                  <Select
                    {...props}
                    value={variant.bundleRecipe ?? ''}
                    onChange={(e) =>
                      onChangeVariant(vIdx, {
                        ...variant,
                        bundleRecipe:
                          e.target.value === 'chiffon_mix'
                            ? 'chiffon_mix'
                            : null,
                      })
                    }
                  >
                    <option value="">Belum ditetapkan</option>
                    <option value="chiffon_mix">
                      chiffon_mix (4 rasa × 3)
                    </option>
                  </Select>
                )}
              </FormField>

              <FormField
                label="Total Unit"
                error={fieldErrors[`${prefix}.bundleUnitsTotal`]?.[0]}
              >
                {(props) => (
                  <Input
                    {...props}
                    type="number"
                    min={1}
                    max={99}
                    value={
                      variant.bundleUnitsTotal === null
                        ? ''
                        : String(variant.bundleUnitsTotal)
                    }
                    onChange={(e) => {
                      const val = Number.parseInt(e.target.value, 10);
                      onChangeVariant(vIdx, {
                        ...variant,
                        bundleUnitsTotal: Number.isFinite(val) ? val : null,
                      });
                    }}
                  />
                )}
              </FormField>

              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={variant.bundleRulesVerified}
                  onChange={(e) =>
                    onChangeVariant(vIdx, {
                      ...variant,
                      bundleRulesVerified: e.target.checked,
                    })
                  }
                />
                <span>Verifikasi Aturan Paket Selesai</span>
              </label>
            </div>

            <div className="admin-editor-subsection">
              <div className="admin-section-header">
                <strong>Komponen Tetap (Fixed: Cheese 3 + Choco 3)</strong>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const nextFixed: AdminConfigFixedComponent = {
                      id: crypto.randomUUID(),
                      componentVariantId: eligibleComponents[0]?.id ?? '',
                      componentSlot: variant.fixedComponents.some(
                        (f) => f.componentSlot === 'cheese',
                      )
                        ? 'choco'
                        : 'cheese',
                      quantity: 3,
                      sortOrder: (variant.fixedComponents.length + 1) * 10,
                    };
                    onChangeVariant(vIdx, {
                      ...variant,
                      fixedComponents: [...variant.fixedComponents, nextFixed],
                    });
                  }}
                >
                  <Plus size={14} aria-hidden="true" />
                  <span>Tambah Komponen Tetap</span>
                </Button>
              </div>

              {variant.fixedComponents.map((fixed, fIdx) => (
                <div key={fixed.id} className="admin-form-row-3">
                  <FormField
                    label="Slot"
                    error={
                      fieldErrors[
                        `${prefix}.fixedComponents.${fIdx}.componentSlot`
                      ]?.[0]
                    }
                  >
                    {(props) => (
                      <Select
                        {...props}
                        value={fixed.componentSlot}
                        onChange={(e) => {
                          const next = variant.fixedComponents.map((item, i) =>
                            i === fIdx
                              ? {
                                  ...item,
                                  componentSlot: e.target.value as
                                    'cheese' | 'choco',
                                }
                              : item,
                          );
                          onChangeVariant(vIdx, {
                            ...variant,
                            fixedComponents: next,
                          });
                        }}
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
                        `${prefix}.fixedComponents.${fIdx}.componentVariantId`
                      ]?.[0]
                    }
                  >
                    {(props) => (
                      <Select
                        {...props}
                        value={fixed.componentVariantId}
                        onChange={(e) => {
                          const next = variant.fixedComponents.map((item, i) =>
                            i === fIdx
                              ? { ...item, componentVariantId: e.target.value }
                              : item,
                          );
                          onChangeVariant(vIdx, {
                            ...variant,
                            fixedComponents: next,
                          });
                        }}
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
                          `${prefix}.fixedComponents.${fIdx}.quantity`
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
                            const next = variant.fixedComponents.map(
                              (item, i) =>
                                i === fIdx
                                  ? {
                                      ...item,
                                      quantity: Number.isFinite(val) ? val : 1,
                                    }
                                  : item,
                            );
                            onChangeVariant(vIdx, {
                              ...variant,
                              fixedComponents: next,
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
                      onClick={() => {
                        onChangeVariant(vIdx, {
                          ...variant,
                          fixedComponents: variant.fixedComponents.filter(
                            (_, i) => i !== fIdx,
                          ),
                        });
                      }}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-editor-subsection">
              <div className="admin-section-header">
                <strong>Grup Pilihan Tambahan (Option Groups)</strong>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const nextGroup: AdminConfigOptionGroup = {
                      id: crypto.randomUUID(),
                      name: `Grup Pilihan ${variant.optionGroups.length + 1}`,
                      minSelect: 1,
                      maxSelect: 1,
                      quantityPerSelection: 3,
                      sortOrder: (variant.optionGroups.length + 1) * 10,
                      isRequired: true,
                      choices: [],
                    };
                    onChangeVariant(vIdx, {
                      ...variant,
                      optionGroups: [...variant.optionGroups, nextGroup],
                    });
                  }}
                >
                  <Plus size={14} aria-hidden="true" />
                  <span>Tambah Grup</span>
                </Button>
              </div>

              {fieldErrors[`${prefix}.optionGroups`]?.[0] ? (
                <Feedback
                  tone="error"
                  title={fieldErrors[`${prefix}.optionGroups`][0]}
                  announce
                />
              ) : null}

              {variant.optionGroups.map((group, gIdx) => (
                <Card
                  key={group.id}
                  tone="cream"
                  className="admin-editor-subgroup"
                >
                  <div className="admin-editor-item-header">
                    <FormField
                      label={`Nama Grup #${gIdx + 1}`}
                      error={
                        fieldErrors[`${prefix}.optionGroups.${gIdx}.name`]?.[0]
                      }
                    >
                      {(props) => (
                        <Input
                          {...props}
                          value={group.name}
                          onChange={(e) => {
                            const next = variant.optionGroups.map((g, i) =>
                              i === gIdx ? { ...g, name: e.target.value } : g,
                            );
                            onChangeVariant(vIdx, {
                              ...variant,
                              optionGroups: next,
                            });
                          }}
                        />
                      )}
                    </FormField>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onChangeVariant(vIdx, {
                          ...variant,
                          optionGroups: variant.optionGroups.filter(
                            (_, i) => i !== gIdx,
                          ),
                        });
                      }}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      <span>Hapus Grup</span>
                    </Button>
                  </div>

                  {fieldErrors[
                    `${prefix}.optionGroups.${gIdx}.choices`
                  ]?.[0] ? (
                    <p className="field-error" role="alert">
                      {fieldErrors[`${prefix}.optionGroups.${gIdx}.choices`][0]}
                    </p>
                  ) : null}

                  <div className="admin-editor-stack">
                    {group.choices.map((choice, cIdx) => (
                      <div key={choice.id} className="admin-form-row-3">
                        <FormField
                          label="Label Pilihan"
                          error={
                            fieldErrors[
                              `${prefix}.optionGroups.${gIdx}.choices.${cIdx}.label`
                            ]?.[0]
                          }
                        >
                          {(props) => (
                            <Input
                              {...props}
                              value={choice.label}
                              onChange={(e) => {
                                const nextChoices = group.choices.map(
                                  (ch, i) =>
                                    i === cIdx
                                      ? { ...ch, label: e.target.value }
                                      : ch,
                                );
                                const nextGroups = variant.optionGroups.map(
                                  (g, i) =>
                                    i === gIdx
                                      ? { ...g, choices: nextChoices }
                                      : g,
                                );
                                onChangeVariant(vIdx, {
                                  ...variant,
                                  optionGroups: nextGroups,
                                });
                              }}
                            />
                          )}
                        </FormField>

                        <FormField
                          label="SKU Komponen"
                          error={
                            fieldErrors[
                              `${prefix}.optionGroups.${gIdx}.choices.${cIdx}.componentVariantId`
                            ]?.[0]
                          }
                        >
                          {(props) => (
                            <Select
                              {...props}
                              value={choice.componentVariantId}
                              onChange={(e) => {
                                const comp = eligibleComponents.find(
                                  (c) => c.id === e.target.value,
                                );
                                const nextChoices = group.choices.map(
                                  (ch, i) =>
                                    i === cIdx
                                      ? {
                                          ...ch,
                                          componentVariantId: e.target.value,
                                          label:
                                            ch.label ||
                                            (comp
                                              ? `${comp.productName} (3 pcs)`
                                              : ''),
                                        }
                                      : ch,
                                );
                                const nextGroups = variant.optionGroups.map(
                                  (g, i) =>
                                    i === gIdx
                                      ? { ...g, choices: nextChoices }
                                      : g,
                                );
                                onChangeVariant(vIdx, {
                                  ...variant,
                                  optionGroups: nextGroups,
                                });
                              }}
                            >
                              <option value="">Pilih SKU komponen...</option>
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
                          <FormField label="Delta Harga (IDR)">
                            {(props) => (
                              <Input
                                {...props}
                                type="number"
                                min={0}
                                step={1}
                                value={String(choice.priceDeltaIdr)}
                                onChange={(e) => {
                                  const val = Number.parseInt(
                                    e.target.value,
                                    10,
                                  );
                                  const nextChoices = group.choices.map(
                                    (ch, i) =>
                                      i === cIdx
                                        ? {
                                            ...ch,
                                            priceDeltaIdr: Number.isFinite(val)
                                              ? val
                                              : 0,
                                          }
                                        : ch,
                                  );
                                  const nextGroups = variant.optionGroups.map(
                                    (g, i) =>
                                      i === gIdx
                                        ? { ...g, choices: nextChoices }
                                        : g,
                                  );
                                  onChangeVariant(vIdx, {
                                    ...variant,
                                    optionGroups: nextGroups,
                                  });
                                }}
                              />
                            )}
                          </FormField>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label="Hapus pilihan"
                            onClick={() => {
                              const nextChoices = group.choices.filter(
                                (_, i) => i !== cIdx,
                              );
                              const nextGroups = variant.optionGroups.map(
                                (g, i) =>
                                  i === gIdx
                                    ? { ...g, choices: nextChoices }
                                    : g,
                              );
                              onChangeVariant(vIdx, {
                                ...variant,
                                optionGroups: nextGroups,
                              });
                            }}
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const nextChoice: AdminConfigOptionChoice = {
                        id: crypto.randomUUID(),
                        label: eligibleComponents[0]?.productName ?? 'Pilihan',
                        componentVariantId: eligibleComponents[0]?.id ?? '',
                        priceDeltaIdr: 0,
                        isActive: true,
                        sortOrder: (group.choices.length + 1) * 10,
                      };
                      const nextGroups = variant.optionGroups.map((g, i) =>
                        i === gIdx
                          ? { ...g, choices: [...g.choices, nextChoice] }
                          : g,
                      );
                      onChangeVariant(vIdx, {
                        ...variant,
                        optionGroups: nextGroups,
                      });
                    }}
                  >
                    <Plus size={14} aria-hidden="true" />
                    <span>Tambah Pilihan Rasa</span>
                  </Button>
                </Card>
              ))}
            </div>
          </Card>
        );
      })}
    </section>
  );
}
