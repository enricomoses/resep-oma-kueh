'use client';

import { Plus, RefreshCw, Tag } from 'lucide-react';

import { AdminSectionHeader } from '@/app/admin/(dashboard)/_components/admin-section-header';
import { ConfirmDialog } from '@/components/common/feedback/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { PROMOTION_COPY } from '@/constants/promotion.constant';
import { useAdminPromotionsManager } from '@/hooks/use-admin-promotions-manager';
import type { AdminSessionProfile } from '@/types/auth';
import type { AdminPromotionsListResponse } from '@/types/promotion';
import { cn } from '@/utils';

import { AdminPromotionCard } from './admin-promotion-card';
import { AdminPromotionFormCard } from './admin-promotion-form-card';
import { AdminShippingBannerCard } from './admin-shipping-banner-card';

interface AdminPromotionsViewProps {
  profile: AdminSessionProfile;
  initialData?: AdminPromotionsListResponse;
  className?: string;
}

/** Thin composition view for managing promotions and shipping info banners. */
export function AdminPromotionsView({
  profile,
  initialData,
  className,
}: AdminPromotionsViewProps) {
  const {
    promotions,
    references,
    previewExamples,
    isFetching,
    isError,
    refetch,
    formOpen,
    setFormOpen,
    formState,
    setFormState,
    slugTouched,
    setSlugTouched,
    formError,
    fieldErrors,
    uploadError,
    isUploadingBanner,
    feedbackMsg,
    archiveTarget,
    setArchiveTarget,
    bannerForm,
    setBannerForm,
    bannerError,
    bannerSuccess,
    isSaving,
    isArchiving,
    isSavingBanner,
    openCreateForm,
    openEditForm,
    handleBannerFileChange,
    handleSavePromotion,
    handleConfirmArchive,
    handleSaveShippingBanner,
  } = useAdminPromotionsManager({
    profile,
    initialData,
  });

  return (
    <div className={cn('admin-page space-y-6', className)}>
      <AdminSectionHeader
        title={ADMIN_CATALOG_COPY.PROMOTIONS.TITLE}
        description={ADMIN_CATALOG_COPY.PROMOTIONS.SUBTITLE}
        headingAs="h1"
        className="admin-page-header"
        titleClassName="admin-page-title"
        actions={
          <div className="admin-inline-actions">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw size={15} aria-hidden="true" />
              {ADMIN_CATALOG_COPY.PROMOTIONS.REFRESH}
            </Button>
            <Button variant="primary" size="sm" onClick={openCreateForm}>
              <Plus size={15} aria-hidden="true" />
              {ADMIN_CATALOG_COPY.PROMOTIONS.ADD_BUTTON}
            </Button>
          </div>
        }
      />

      {feedbackMsg ? (
        <Feedback tone="success" title={feedbackMsg} announce />
      ) : null}
      {formError && !formOpen ? (
        <Feedback tone="error" title={formError} announce />
      ) : null}
      {isError ? (
        <Feedback
          tone="error"
          title="Gagal memuat daftar promosi admin."
          announce
        />
      ) : null}

      <AdminShippingBannerCard
        form={bannerForm}
        setForm={setBannerForm}
        error={bannerError}
        success={bannerSuccess}
        isSaving={isSavingBanner}
        onSave={() => void handleSaveShippingBanner()}
      />

      {formOpen ? (
        <AdminPromotionFormCard
          formState={formState}
          setFormState={setFormState}
          slugTouched={slugTouched}
          setSlugTouched={setSlugTouched}
          formError={formError}
          fieldErrors={fieldErrors}
          uploadError={uploadError}
          isUploadingBanner={isUploadingBanner}
          isSaving={isSaving}
          references={references}
          previewExamples={previewExamples}
          onBannerFileChange={(file) => void handleBannerFileChange(file)}
          onSave={() => void handleSavePromotion()}
          onClose={() => setFormOpen(false)}
        />
      ) : null}

      {promotions.length === 0 ? (
        <Feedback title={ADMIN_CATALOG_COPY.PROMOTIONS.EMPTY} />
      ) : (
        <div className="space-y-4">
          {promotions.map((item) => (
            <AdminPromotionCard
              key={item.id}
              item={item}
              onEdit={openEditForm}
              onArchive={setArchiveTarget}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
        title={ADMIN_CATALOG_COPY.PROMOTIONS.ARCHIVE_CONFIRM_TITLE}
        description={ADMIN_CATALOG_COPY.PROMOTIONS.ARCHIVE_CONFIRM_DESC}
        cancelLabel="Batal"
        confirmLabel={ADMIN_CATALOG_COPY.PROMOTIONS.ARCHIVE_CONFIRM_SUBMIT}
        loadingLabel="Mengarsipkan..."
        isLoading={isArchiving}
        onConfirm={() => void handleConfirmArchive()}
      />

      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Tag size={14} aria-hidden="true" />
        {PROMOTION_COPY.NON_STACKABLE_NOTE}
      </p>
    </div>
  );
}
