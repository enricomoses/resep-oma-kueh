'use client';

import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type {
  AdminConfigDietaryTag,
  AdminDietaryVerificationStatus,
  AdminReferenceDietaryTag,
} from '@/types/admin-catalog';

interface AdminProductDietaryTagListProps {
  errorPrefix: string;
  dietaryTags: AdminConfigDietaryTag[];
  referenceDietaryTags: AdminReferenceDietaryTag[];
  unusedDietaryTags: AdminReferenceDietaryTag[];
  fieldErrors: Record<string, string[]>;
  onChange: (nextTags: AdminConfigDietaryTag[]) => void;
}

/** Subsection listing dietary claims and written verification evidence notes for one SKU variant. */
export function AdminProductDietaryTagList({
  errorPrefix,
  dietaryTags,
  referenceDietaryTags,
  unusedDietaryTags,
  fieldErrors,
  onChange,
}: AdminProductDietaryTagListProps) {
  if (dietaryTags.length === 0) return null;

  function updateTagAt(
    idx: number,
    updater: (tag: AdminConfigDietaryTag) => AdminConfigDietaryTag,
  ) {
    onChange(dietaryTags.map((item, i) => (i === idx ? updater(item) : item)));
  }

  return (
    <div className="admin-editor-subsection">
      <strong>Label Diet</strong>
      {dietaryTags.map((tag, dIdx) => {
        const refTag = referenceDietaryTags.find(
          (item) => item.id === tag.dietaryTagId,
        );
        return (
          <div key={tag.dietaryTagId} className="admin-editor-subrow">
            <div className="admin-form-row-2">
              <FormField
                label="Label Diet"
                error={
                  fieldErrors[
                    `${errorPrefix}.dietaryTags.${dIdx}.dietaryTagId`
                  ]?.[0]
                }
              >
                {(props) => (
                  <Select
                    {...props}
                    value={tag.dietaryTagId}
                    onChange={(e) =>
                      updateTagAt(dIdx, (item) => ({
                        ...item,
                        dietaryTagId: e.target.value,
                      }))
                    }
                  >
                    {refTag ? (
                      <option value={refTag.id}>{refTag.name}</option>
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
                    `${errorPrefix}.dietaryTags.${dIdx}.verificationStatus`
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
                      updateTagAt(dIdx, (item) => ({
                        ...item,
                        verificationStatus: status,
                        verifiedAt:
                          status === 'verified'
                            ? (item.verifiedAt ?? new Date().toISOString())
                            : null,
                      }));
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
                fieldErrors[`${errorPrefix}.dietaryTags.${dIdx}.note`]?.[0]
              }
            >
              {(props) => (
                <Textarea
                  {...props}
                  rows={2}
                  placeholder="Tuliskan hasil verifikasi bahan baku, pemasok, dan tanggal pengecekan..."
                  value={tag.note ?? ''}
                  onChange={(e) =>
                    updateTagAt(dIdx, (item) => ({
                      ...item,
                      note: e.target.value.length > 0 ? e.target.value : null,
                    }))
                  }
                />
              )}
            </FormField>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(dietaryTags.filter((_, i) => i !== dIdx))}
            >
              <Trash2 size={14} aria-hidden="true" />
              <span>Hapus Klaim Diet</span>
            </Button>
          </div>
        );
      })}
    </div>
  );
}
