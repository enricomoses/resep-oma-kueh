'use client';

import { Plus, RefreshCw, ShieldCheck } from 'lucide-react';

import { AdminSectionHeader } from '@/app/admin/(dashboard)/_components/admin-section-header';
import { WhatTheySaySection } from '@/components/common/content/what-they-say-section';
import { ConfirmDialog } from '@/components/common/feedback/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { useAdminTestimonialsManager } from '@/hooks/use-admin-testimonials-manager';
import type { AdminTestimonialListResponse } from '@/types/admin-cms';
import type { AdminSessionProfile } from '@/types/auth';
import { cn } from '@/utils';

import { AdminTestimonialCard } from './admin-testimonial-card';
import { AdminTestimonialEditorDialog } from './admin-testimonial-editor-dialog';

interface AdminTestimonialsViewProps {
  profile: AdminSessionProfile;
  initialData?: AdminTestimonialListResponse;
  className?: string;
}

/** Thin composition view for consent-gated testimonials management and public preview. */
export function AdminTestimonialsView({
  profile,
  initialData,
  className,
}: AdminTestimonialsViewProps) {
  const {
    items,
    publishedConsented,
    isFetching,
    refetch,
    editorOpen,
    setEditorOpen,
    form,
    setForm,
    archiveTarget,
    setArchiveTarget,
    actionError,
    fieldErrors,
    successMessage,
    isSaving,
    isArchiving,
    openCreate,
    openEdit,
    handleSubmit,
    handlePublish,
    handleConfirmArchive,
  } = useAdminTestimonialsManager({
    profile,
    initialData,
  });

  return (
    <section
      className={cn('admin-module-page', className)}
      aria-labelledby="admin-testimonials-title"
    >
      <AdminSectionHeader
        className="admin-module-header"
        titleId="admin-testimonials-title"
        title={ADMIN_CATALOG_COPY.TESTIMONIALS.TITLE}
        description={ADMIN_CATALOG_COPY.TESTIMONIALS.SUBTITLE}
        actions={
          <div className="admin-inline-actions">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void refetch()}
              loading={isFetching}
            >
              <RefreshCw size={16} aria-hidden="true" />
              {ADMIN_CATALOG_COPY.TESTIMONIALS.REFRESH}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={openCreate}
            >
              <Plus size={16} aria-hidden="true" />
              {ADMIN_CATALOG_COPY.TESTIMONIALS.ADD_BUTTON}
            </Button>
          </div>
        }
      />

      <Feedback
        tone="info"
        title={ADMIN_CATALOG_COPY.TESTIMONIALS.EVIDENCE_PRIVACY_NOTE}
      />

      {actionError ? (
        <Feedback tone="error" title={actionError} announce />
      ) : null}
      {successMessage ? (
        <Feedback tone="success" title={successMessage} announce />
      ) : null}

      <Card tone="cream" className="admin-subpanel">
        <div className="admin-card-head">
          <h3 className="admin-card-title">
            <ShieldCheck size={18} aria-hidden="true" className="mr-1 inline" />
            {ADMIN_CATALOG_COPY.TESTIMONIALS.PREVIEW_HEADING}
          </h3>
          <Badge tone={publishedConsented.length > 0 ? 'success' : 'neutral'}>
            {publishedConsented.length} Terpublikasi & Berizin
          </Badge>
        </div>
        {publishedConsented.length === 0 ? (
          <p className="admin-section-subtitle mb-3">
            {ADMIN_CATALOG_COPY.TESTIMONIALS.PREVIEW_PUBLIC_HIDDEN_NOTE}
          </p>
        ) : null}
        <WhatTheySaySection
          allowEmptyPreview
          testimonials={{
            status: 'success',
            data: publishedConsented.map((item) => ({
              id: item.id,
              displayName: item.displayName,
              quote: item.quote,
              rating: item.rating,
              sourceLabel: item.sourceLabel ?? 'Pelanggan Resep Oma Kueh',
            })),
          }}
        />
      </Card>

      {items.length === 0 ? (
        <Feedback title={ADMIN_CATALOG_COPY.TESTIMONIALS.EMPTY} />
      ) : (
        <div className="admin-cards-grid">
          {items.map((item) => (
            <AdminTestimonialCard
              key={item.id}
              item={item}
              onEdit={openEdit}
              onPublish={(target) => void handlePublish(target)}
              onArchive={setArchiveTarget}
            />
          ))}
        </div>
      )}

      <AdminTestimonialEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        form={form}
        onFormChange={setForm}
        fieldErrors={fieldErrors}
        isSaving={isSaving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
        title={ADMIN_CATALOG_COPY.TESTIMONIALS.ARCHIVE_CONFIRM_TITLE}
        description={ADMIN_CATALOG_COPY.TESTIMONIALS.ARCHIVE_CONFIRM_DESC}
        confirmLabel={ADMIN_CATALOG_COPY.TESTIMONIALS.ARCHIVE_CONFIRM_SUBMIT}
        cancelLabel="Batal"
        isLoading={isArchiving}
        loadingLabel="Mengarsipkan..."
        onConfirm={() => void handleConfirmArchive()}
        actionsClassName="admin-inline-actions"
      />
    </section>
  );
}
