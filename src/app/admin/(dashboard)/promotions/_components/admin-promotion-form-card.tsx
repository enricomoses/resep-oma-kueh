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
    <Card tone="surface" className={cn('space-y-5', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="admin-card-title">
            {formState.id ? 'Ubah Promosi' : 'Buat Promosi Baru'}
          </h2>
          <p className="text-muted-foreground text-xs">
            {PROMOTION_COPY.ENDS_EXCLUSIVE_NOTE}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Tutup Form
        </Button>
      </div>

      {formError ? <Feedback tone="error" title={formError} announce /> : null}

      <div className="grid gap-4 md:grid-cols-2">
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
              setFormState((prev) => ({ ...prev, description: e.target.value }))
            }
          />
        )}
      </FormField>

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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
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
            Aktifkan Promo (Toggle isEnabled)
          </label>

          <label className="text-muted-foreground flex items-center gap-2 text-xs">
            <input type="checkbox" checked={false} disabled readOnly />
            Non-stackable (tetap false) — {PROMOTION_COPY.NON_STACKABLE_NOTE}
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

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={onSave}
          disabled={isSaving || isUploadingBanner}
        >
          {isSaving ? 'Menyimpan...' : 'Simpan Promosi'}
        </Button>
      </div>
    </Card>
  );
}
