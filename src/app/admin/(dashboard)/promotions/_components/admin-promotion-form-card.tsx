'use client';

import type { Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PROMOTION_COPY } from '@/constants/promotion.constant';
import type {
  AdminPromotionReferenceOptions,
  PromotionFormState,
} from '@/types/promotion';
import { cn } from '@/utils';
import {
  type PromotionPreviewScenario,
  slugifyPromotionTitle,
  togglePromotionTargetId,
} from '@/utils/admin-promotions';

import { AdminPromotionBannerField } from './admin-promotion-banner-field';
import { AdminPromotionBranchTargets } from './admin-promotion-branch-targets';
import { AdminPromotionDiscountFields } from './admin-promotion-discount-fields';
import { AdminPromotionPreviewCard } from './admin-promotion-preview-card';
import { AdminPromotionScheduleFields } from './admin-promotion-schedule-fields';
import { AdminPromotionScopeSection } from './admin-promotion-scope-section';

interface AdminPromotionFormCardProps {
  formState: PromotionFormState;
  setFormState: Dispatch<SetStateAction<PromotionFormState>>;
  slugTouched: boolean;
  setSlugTouched: (touched: boolean) => void;
  formError: string | null;
  fieldErrors: Record<string, string[]>;
  uploadError: string | null;
  isUploadingBanner: boolean;
  isSaving: boolean;
  references: AdminPromotionReferenceOptions;
  previewExamples: PromotionPreviewScenario[];
  onBannerFileChange: (file: File | null) => void;
  onSave: () => void;
  onClose: () => void;
  className?: string;
}

/** Form card for creating and editing single promotions with target scope and live pricing preview. */
export function AdminPromotionFormCard({
  formState,
  setFormState,
  slugTouched,
  setSlugTouched,
  formError,
  fieldErrors,
  uploadError,
  isUploadingBanner,
  isSaving,
  references,
  previewExamples,
  onBannerFileChange,
  onSave,
  onClose,
  className,
}: AdminPromotionFormCardProps) {
  return (
    <Card tone="surface" className={cn('admin-promo-card', className)}>
      <div className="admin-promo-card-head">
        <div>
          <h2 className="admin-promo-card-title">
            {formState.id ? 'Ubah Promosi' : 'Buat Promosi Baru'}
          </h2>
          <p className="admin-promo-card-sub">
            {PROMOTION_COPY.ENDS_EXCLUSIVE_NOTE}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Tutup Form
        </Button>
      </div>

      {formError ? <Feedback tone="error" title={formError} announce /> : null}

      <div className="admin-promo-form-group">
        <h3 className="admin-promo-group-label">Identitas Promo</h3>
        <div className="admin-promo-grid-2">
          <FormField
            id="promo-title"
            label="Judul Promo"
            error={fieldErrors.title?.[0]}
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                value={formState.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setFormState((prev) => ({
                    ...prev,
                    title,
                    slug:
                      !prev.id && !slugTouched
                        ? slugifyPromotionTitle(title)
                        : prev.slug,
                  }));
                }}
                placeholder="Contoh: Promo Akhir Pekan Chiffon"
              />
            )}
          </FormField>

          <FormField
            id="promo-slug"
            label="Slug Promo (Permanen)"
            error={fieldErrors.slug?.[0]}
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                value={formState.slug}
                disabled={Boolean(formState.id)}
                onChange={(e) => {
                  setSlugTouched(true);
                  setFormState((prev) => ({ ...prev, slug: e.target.value }));
                }}
                placeholder="promo-akhir-pekan"
              />
            )}
          </FormField>
        </div>

        <FormField
          id="promo-description"
          label="Deskripsi Singkat (Opsional)"
          error={fieldErrors.description?.[0]}
        >
          {(fieldProps) => (
            <Textarea
              {...fieldProps}
              rows={2}
              value={formState.description}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          )}
        </FormField>
      </div>

      <div className="admin-promo-form-group">
        <h3 className="admin-promo-group-label">Diskon &amp; Jadwal</h3>
        <AdminPromotionDiscountFields
          formState={formState}
          fieldErrors={fieldErrors}
          onChange={setFormState}
        />

        <AdminPromotionScheduleFields
          formState={formState}
          fieldErrors={fieldErrors}
          onChange={setFormState}
        />
      </div>

      <div className="admin-promo-form-group">
        <h3 className="admin-promo-group-label">Aktivasi &amp; Banner</h3>
        <div className="admin-promo-grid-2">
          <div className="admin-promo-checkbox-panel">
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={formState.isEnabled}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    isEnabled: e.target.checked,
                  }))
                }
              />
              <span>Aktifkan Promo (Toggle isEnabled)</span>
            </label>

            <label className="admin-promo-muted-check">
              <input type="checkbox" checked={false} disabled readOnly />
              <span>
                Non-stackable (tetap false) —{' '}
                {PROMOTION_COPY.NON_STACKABLE_NOTE}
              </span>
            </label>
          </div>

          <AdminPromotionBannerField
            bannerPreviewUrl={formState.bannerPreviewUrl}
            bannerImagePath={formState.bannerImagePath}
            isUploading={isUploadingBanner}
            uploadError={uploadError}
            onFileChange={onBannerFileChange}
            onRemoveBanner={() =>
              setFormState((prev) => ({
                ...prev,
                bannerImagePath: null,
                bannerDraftPath: null,
                bannerPreviewUrl: null,
              }))
            }
          />
        </div>
      </div>

      <div className="admin-promo-form-group">
        <h3 className="admin-promo-group-label">Target &amp; Pratinjau</h3>
        <AdminPromotionScopeSection
          formState={formState}
          fieldErrors={fieldErrors}
          references={references}
          onChange={setFormState}
        />

        <AdminPromotionBranchTargets
          branches={references.branches}
          selectedBranchIds={formState.branchIds}
          errorMessage={fieldErrors.branchIds?.[0]}
          onToggleBranch={(branchId) =>
            setFormState((prev) => ({
              ...prev,
              branchIds: togglePromotionTargetId(prev.branchIds, branchId),
            }))
          }
        />

        <AdminPromotionPreviewCard previewExamples={previewExamples} />
      </div>

      <div className="admin-promo-card-footer admin-promo-card-footer--end">
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Batal
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          loading={isSaving}
          loadingLabel="Menyimpan..."
          onClick={onSave}
          disabled={isSaving || isUploadingBanner}
        >
          <span>Simpan Promosi</span>
        </Button>
      </div>
    </Card>
  );
}
