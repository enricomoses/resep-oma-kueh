'use client';

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
  AdminConfigOptionGroup,
  AdminConfigVariant,
  AdminReferenceComponentVariant,
} from '@/types/admin-catalog';
import { cn } from '@/utils';

import { AdminProductBundleFixedList } from './admin-product-bundle-fixed-list';
import { AdminProductBundleOptionGroups } from './admin-product-bundle-option-groups';

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

/** Editor section for configuring bundle recipes, fixed components, and selectable flavor option groups. */
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

            <AdminProductBundleFixedList
              errorPrefix={prefix}
              fixedComponents={variant.fixedComponents}
              eligibleComponents={eligibleComponents}
              fieldErrors={fieldErrors}
              onChange={(nextFixed) =>
                onChangeVariant(vIdx, {
                  ...variant,
                  fixedComponents: nextFixed,
                })
              }
            />

            <AdminProductBundleOptionGroups
              errorPrefix={prefix}
              optionGroups={variant.optionGroups}
              eligibleComponents={eligibleComponents}
              fieldErrors={fieldErrors}
              onChange={(nextGroups) =>
                onChangeVariant(vIdx, { ...variant, optionGroups: nextGroups })
              }
            />
          </Card>
        );
      })}
    </section>
  );
}
