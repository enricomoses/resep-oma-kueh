'use client';

import { Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type {
  AdminAllergenPresence,
  AdminConfigAllergen,
  AdminReferenceAllergen,
} from '@/types/admin-catalog';

interface AdminProductAllergenListProps {
  allergens: AdminConfigAllergen[];
  referenceAllergens: AdminReferenceAllergen[];
  unusedAllergens: AdminReferenceAllergen[];
  onChange: (nextAllergens: AdminConfigAllergen[]) => void;
}

/** Subsection listing explicit allergen declarations and verification status for one SKU variant. */
export function AdminProductAllergenList({
  allergens,
  referenceAllergens,
  unusedAllergens,
  onChange,
}: AdminProductAllergenListProps) {
  if (allergens.length === 0) return null;

  function updateAllergenAt(
    idx: number,
    updater: (allergen: AdminConfigAllergen) => AdminConfigAllergen,
  ) {
    onChange(allergens.map((item, i) => (i === idx ? updater(item) : item)));
  }

  return (
    <div className="admin-editor-subsection">
      <strong>Deklarasi Alergen</strong>
      {allergens.map((allergen, aIdx) => {
        const refAllergen = referenceAllergens.find(
          (item) => item.id === allergen.allergenId,
        );
        return (
          <div key={allergen.allergenId} className="admin-editor-subrow">
            <div className="admin-form-row-3">
              <FormField label="Alergen">
                {(props) => (
                  <Select
                    {...props}
                    value={allergen.allergenId}
                    onChange={(e) =>
                      updateAllergenAt(aIdx, (item) => ({
                        ...item,
                        allergenId: e.target.value,
                      }))
                    }
                  >
                    {refAllergen ? (
                      <option value={refAllergen.id}>{refAllergen.name}</option>
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
                    onChange={(e) =>
                      updateAllergenAt(aIdx, (item) => ({
                        ...item,
                        presence: e.target.value as AdminAllergenPresence,
                      }))
                    }
                  >
                    <option value="contains">Mengandung</option>
                    <option value="may_contain">
                      Mungkin Mengandung (Jejak)
                    </option>
                    <option value="not_declared">Belum Dideklarasikan</option>
                  </Select>
                )}
              </FormField>

              <div className="admin-inline-actions">
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={Boolean(allergen.verifiedAt)}
                    onChange={(e) =>
                      updateAllergenAt(aIdx, (item) => ({
                        ...item,
                        verifiedAt: e.target.checked
                          ? new Date().toISOString()
                          : null,
                      }))
                    }
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
                  onChange={(e) =>
                    updateAllergenAt(aIdx, (item) => ({
                      ...item,
                      sourceNote:
                        e.target.value.length > 0 ? e.target.value : null,
                    }))
                  }
                />
              )}
            </FormField>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(allergens.filter((_, i) => i !== aIdx))}
            >
              <Trash2 size={14} aria-hidden="true" />
              <span>Hapus Alergen</span>
            </Button>
          </div>
        );
      })}
    </div>
  );
}
