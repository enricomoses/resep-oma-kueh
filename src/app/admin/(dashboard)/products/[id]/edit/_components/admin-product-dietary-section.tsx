'use client';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type {
  AdminConfigAllergen,
  AdminConfigDietaryTag,
  AdminConfigVariant,
  AdminReferenceAllergen,
  AdminReferenceDietaryTag,
} from '@/types/admin-catalog';
import { cn } from '@/utils';

import { AdminProductAllergenList } from './admin-product-allergen-list';
import { AdminProductDietaryTagList } from './admin-product-dietary-tag-list';

interface AdminProductDietarySectionProps {
  variants: AdminConfigVariant[];
  referenceDietaryTags: AdminReferenceDietaryTag[];
  referenceAllergens: AdminReferenceAllergen[];
  fieldErrors: Record<string, string[]>;
  onChangeVariant: (
    variantIndex: number,
    nextVariant: AdminConfigVariant,
  ) => void;
  className?: string;
}

/** Section composing verified dietary tag claims and allergen declarations per product SKU. */
export function AdminProductDietarySection({
  variants,
  referenceDietaryTags,
  referenceAllergens,
  fieldErrors,
  onChangeVariant,
  className,
}: AdminProductDietarySectionProps) {
  return (
    <section
      className={cn('admin-editor-section', className)}
      aria-labelledby="dietary-section-heading"
    >
      <div>
        <h3 id="dietary-section-heading" className="admin-editor-heading">
          Klaim Diet Terverifikasi &amp; Deklarasi Alergen (Per Varian SKU)
        </h3>
        <p className="admin-row-meta">
          Status <strong>Terverifikasi</strong> tidak boleh dicentang tanpa
          catatan bukti pemeriksaan tertulis dari Owner. Ketidakadaan alergen
          harus dicatat eksplisit, bukan diasumsikan bebas.
        </p>
      </div>

      <div className="admin-editor-stack">
        {variants.map((variant, vIdx) => {
          const unusedDietaryTags = referenceDietaryTags.filter(
            (dt) => !variant.dietaryTags.some((t) => t.dietaryTagId === dt.id),
          );
          const unusedAllergens = referenceAllergens.filter(
            (al) => !variant.allergens.some((a) => a.allergenId === al.id),
          );

          return (
            <Card key={variant.id} className="admin-editor-item-card">
              <div className="admin-editor-item-header">
                <strong>
                  {variant.name} ({variant.sku})
                </strong>
                <div className="admin-inline-actions">
                  {unusedDietaryTags.length > 0 ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const nextTag: AdminConfigDietaryTag = {
                          dietaryTagId: unusedDietaryTags[0].id,
                          verificationStatus: 'pending',
                          verifiedAt: null,
                          note: null,
                        };
                        onChangeVariant(vIdx, {
                          ...variant,
                          dietaryTags: [...variant.dietaryTags, nextTag],
                        });
                      }}
                    >
                      <Plus size={14} aria-hidden="true" />
                      <span>Tambah Label Diet</span>
                    </Button>
                  ) : null}

                  {unusedAllergens.length > 0 ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const nextAllergen: AdminConfigAllergen = {
                          allergenId: unusedAllergens[0].id,
                          presence: 'not_declared',
                          sourceNote: null,
                          verifiedAt: null,
                        };
                        onChangeVariant(vIdx, {
                          ...variant,
                          allergens: [...variant.allergens, nextAllergen],
                        });
                      }}
                    >
                      <Plus size={14} aria-hidden="true" />
                      <span>Tambah Alergen</span>
                    </Button>
                  ) : null}
                </div>
              </div>

              <AdminProductDietaryTagList
                errorPrefix={`variants.${vIdx}`}
                dietaryTags={variant.dietaryTags}
                referenceDietaryTags={referenceDietaryTags}
                unusedDietaryTags={unusedDietaryTags}
                fieldErrors={fieldErrors}
                onChange={(nextTags) =>
                  onChangeVariant(vIdx, { ...variant, dietaryTags: nextTags })
                }
              />

              <AdminProductAllergenList
                allergens={variant.allergens}
                referenceAllergens={referenceAllergens}
                unusedAllergens={unusedAllergens}
                onChange={(nextAllergens) =>
                  onChangeVariant(vIdx, {
                    ...variant,
                    allergens: nextAllergens,
                  })
                }
              />
            </Card>
          );
        })}
      </div>
    </section>
  );
}
