'use client';

import { Plus, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type {
  AdminAllergenPresence,
  AdminConfigAllergen,
  AdminConfigDietaryTag,
  AdminConfigVariant,
  AdminDietaryVerificationStatus,
  AdminReferenceAllergen,
  AdminReferenceDietaryTag,
} from '@/types/admin-catalog';
import { cn } from '@/utils';

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
          const prefix = `variants.${vIdx}`;
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

              {variant.dietaryTags.length > 0 ? (
                <div className="admin-editor-subsection">
                  <strong>Label Diet</strong>
                  {variant.dietaryTags.map((tag, dIdx) => {
                    const refTag = referenceDietaryTags.find(
                      (item) => item.id === tag.dietaryTagId,
                    );
                    return (
                      <div
                        key={tag.dietaryTagId}
                        className="admin-editor-subrow"
                      >
                        <div className="admin-form-row-2">
                          <FormField
                            label="Label Diet"
                            error={
                              fieldErrors[
                                `${prefix}.dietaryTags.${dIdx}.dietaryTagId`
                              ]?.[0]
                            }
                          >
                            {(props) => (
                              <Select
                                {...props}
                                value={tag.dietaryTagId}
                                onChange={(e) => {
                                  const next = variant.dietaryTags.map(
                                    (item, i) =>
                                      i === dIdx
                                        ? {
                                            ...item,
                                            dietaryTagId: e.target.value,
                                          }
                                        : item,
                                  );
                                  onChangeVariant(vIdx, {
                                    ...variant,
                                    dietaryTags: next,
                                  });
                                }}
                              >
                                {refTag ? (
                                  <option value={refTag.id}>
                                    {refTag.name}
                                  </option>
                                ) : null}
                                {unusedDietaryTags.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.name}
                                  </option>
                                ))}
                              </Select>
                            )}
                          </FormField>

                          <FormField
                            label="Status Verifikasi"
                            error={
                              fieldErrors[
                                `${prefix}.dietaryTags.${dIdx}.verificationStatus`
                              ]?.[0]
                            }
                          >
                            {(props) => (
                              <Select
                                {...props}
                                value={tag.verificationStatus}
                                onChange={(e) => {
                                  const status = e.target
                                    .value as AdminDietaryVerificationStatus;
                                  const next = variant.dietaryTags.map(
                                    (item, i) =>
                                      i === dIdx
                                        ? {
                                            ...item,
                                            verificationStatus: status,
                                            verifiedAt:
                                              status === 'verified'
                                                ? (item.verifiedAt ??
                                                  new Date().toISOString())
                                                : null,
                                          }
                                        : item,
                                  );
                                  onChangeVariant(vIdx, {
                                    ...variant,
                                    dietaryTags: next,
                                  });
                                }}
                              >
                                <option value="pending">
                                  Pending / Belum Terverifikasi
                                </option>
                                <option value="verified">
                                  Terverifikasi Owner (Wajib Bukti)
                                </option>
                              </Select>
                            )}
                          </FormField>
                        </div>

                        <FormField
                          label="Catatan Bukti Verifikasi (Privat Owner)"
                          required={tag.verificationStatus === 'verified'}
                          error={
                            fieldErrors[
                              `${prefix}.dietaryTags.${dIdx}.note`
                            ]?.[0]
                          }
                        >
                          {(props) => (
                            <Textarea
                              {...props}
                              rows={2}
                              placeholder="Tuliskan hasil verifikasi bahan baku, pemasok, dan tanggal pengecekan..."
                              value={tag.note ?? ''}
                              onChange={(e) => {
                                const next = variant.dietaryTags.map(
                                  (item, i) =>
                                    i === dIdx
                                      ? {
                                          ...item,
                                          note:
                                            e.target.value.length > 0
                                              ? e.target.value
                                              : null,
                                        }
                                      : item,
                                );
                                onChangeVariant(vIdx, {
                                  ...variant,
                                  dietaryTags: next,
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
                              dietaryTags: variant.dietaryTags.filter(
                                (_, i) => i !== dIdx,
                              ),
                            });
                          }}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          <span>Hapus Klaim Diet</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {variant.allergens.length > 0 ? (
                <div className="admin-editor-subsection">
                  <strong>Deklarasi Alergen</strong>
                  {variant.allergens.map((allergen, aIdx) => {
                    const refAllergen = referenceAllergens.find(
                      (item) => item.id === allergen.allergenId,
                    );
                    return (
                      <div
                        key={allergen.allergenId}
                        className="admin-editor-subrow"
                      >
                        <div className="admin-form-row-3">
                          <FormField label="Alergen">
                            {(props) => (
                              <Select
                                {...props}
                                value={allergen.allergenId}
                                onChange={(e) => {
                                  const next = variant.allergens.map(
                                    (item, i) =>
                                      i === aIdx
                                        ? {
                                            ...item,
                                            allergenId: e.target.value,
                                          }
                                        : item,
                                  );
                                  onChangeVariant(vIdx, {
                                    ...variant,
                                    allergens: next,
                                  });
                                }}
                              >
                                {refAllergen ? (
                                  <option value={refAllergen.id}>
                                    {refAllergen.name}
                                  </option>
                                ) : null}
                                {unusedAllergens.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.name}
                                  </option>
                                ))}
                              </Select>
                            )}
                          </FormField>

                          <FormField label="Status Keberadaan">
                            {(props) => (
                              <Select
                                {...props}
                                value={allergen.presence}
                                onChange={(e) => {
                                  const next = variant.allergens.map(
                                    (item, i) =>
                                      i === aIdx
                                        ? {
                                            ...item,
                                            presence: e.target
                                              .value as AdminAllergenPresence,
                                          }
                                        : item,
                                  );
                                  onChangeVariant(vIdx, {
                                    ...variant,
                                    allergens: next,
                                  });
                                }}
                              >
                                <option value="contains">Mengandung</option>
                                <option value="may_contain">
                                  Mungkin Mengandung (Jejak)
                                </option>
                                <option value="not_declared">
                                  Belum Dideklarasikan
                                </option>
                              </Select>
                            )}
                          </FormField>

                          <div className="admin-inline-actions">
                            <label className="admin-checkbox-label">
                              <input
                                type="checkbox"
                                checked={Boolean(allergen.verifiedAt)}
                                onChange={(e) => {
                                  const next = variant.allergens.map(
                                    (item, i) =>
                                      i === aIdx
                                        ? {
                                            ...item,
                                            verifiedAt: e.target.checked
                                              ? new Date().toISOString()
                                              : null,
                                          }
                                        : item,
                                  );
                                  onChangeVariant(vIdx, {
                                    ...variant,
                                    allergens: next,
                                  });
                                }}
                              />
                              <span>Terverifikasi</span>
                            </label>
                            {allergen.verifiedAt ? (
                              <Badge tone="success">Aktif Publik</Badge>
                            ) : null}
                          </div>
                        </div>

                        <FormField label="Catatan Sumber Bahan (Privat Owner)">
                          {(props) => (
                            <Input
                              {...props}
                              placeholder="Mis. Tepung terigu pemasok X / lini produksi bersama..."
                              value={allergen.sourceNote ?? ''}
                              onChange={(e) => {
                                const next = variant.allergens.map((item, i) =>
                                  i === aIdx
                                    ? {
                                        ...item,
                                        sourceNote:
                                          e.target.value.length > 0
                                            ? e.target.value
                                            : null,
                                      }
                                    : item,
                                );
                                onChangeVariant(vIdx, {
                                  ...variant,
                                  allergens: next,
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
                              allergens: variant.allergens.filter(
                                (_, i) => i !== aIdx,
                              ),
                            });
                          }}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          <span>Hapus Alergen</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
