'use client';

import { Plus, RefreshCw } from 'lucide-react';

import { AdminSectionHeader } from '@/app/admin/(dashboard)/_components/admin-section-header';
import { ConfirmDialog } from '@/components/common/feedback/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { useAdminFaqsManager } from '@/hooks/use-admin-faqs-manager';
import type {
  AdminFaqListResponse,
  AdminPublishingStatus,
} from '@/types/admin-cms';
import type { AdminSessionProfile } from '@/types/auth';
import { cn } from '@/utils';

import { AdminFaqCard } from './admin-faq-card';
import { AdminFaqEditorDialog } from './admin-faq-editor-dialog';

interface AdminFaqsViewProps {
  profile: AdminSessionProfile;
  initialData?: AdminFaqListResponse;
  className?: string;
}

/** Thin composition view for FAQ status filtering and CRUD dialogs. */
export function AdminFaqsView({
  profile,
  initialData,
  className,
}: AdminFaqsViewProps) {
  const {
    totalCount,
    visibleItems,
    isFetching,
    refetch,
    statusFilter,
    setStatusFilter,
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
    handleQuickPublish,
    handleConfirmArchive,
  } = useAdminFaqsManager({
    profile,
    initialData,
  });

  return (
    <section
      className={cn('admin-module-page', className)}
      aria-labelledby="admin-faqs-title"
    >
      <AdminSectionHeader
        className="admin-module-header"
        titleId="admin-faqs-title"
        title={ADMIN_CATALOG_COPY.FAQS.TITLE}
        description={ADMIN_CATALOG_COPY.FAQS.SUBTITLE}
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
              {ADMIN_CATALOG_COPY.FAQS.REFRESH}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={openCreate}
            >
              <Plus size={16} aria-hidden="true" />
              {ADMIN_CATALOG_COPY.FAQS.ADD_BUTTON}
            </Button>
          </div>
        }
      />

      {actionError ? (
        <Feedback tone="error" title={actionError} announce />
      ) : null}
      {successMessage ? (
        <Feedback tone="success" title={successMessage} announce />
      ) : null}

      <div className="admin-filter-row">
        <FormField id="faq-status-filter" label="Filter Status">
          {(fieldProps) => (
            <Select
              {...fieldProps}
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'all' | AdminPublishingStatus)
              }
            >
              <option value="all">Semua ({totalCount})</option>
              <option value="published">Terpublikasi</option>
              <option value="draft">Draf</option>
              <option value="archived">Diarsipkan</option>
            </Select>
          )}
        </FormField>
      </div>

      {visibleItems.length === 0 ? (
        <Feedback title={ADMIN_CATALOG_COPY.FAQS.EMPTY} />
      ) : (
        <div className="admin-cards-grid">
          {visibleItems.map((item) => (
            <AdminFaqCard
              key={item.id}
              item={item}
              onEdit={openEdit}
              onPublish={(target) => void handleQuickPublish(target)}
              onArchive={setArchiveTarget}
            />
          ))}
        </div>
      )}

      <AdminFaqEditorDialog
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
        title={ADMIN_CATALOG_COPY.FAQS.ARCHIVE_CONFIRM_TITLE}
        description={ADMIN_CATALOG_COPY.FAQS.ARCHIVE_CONFIRM_DESC}
        confirmLabel={ADMIN_CATALOG_COPY.FAQS.ARCHIVE_CONFIRM_SUBMIT}
        cancelLabel="Batal"
        isLoading={isArchiving}
        loadingLabel="Mengarsipkan..."
        onConfirm={() => void handleConfirmArchive()}
        actionsClassName="admin-inline-actions"
      />
    </section>
  );
}
