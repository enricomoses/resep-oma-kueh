'use client';

import { Plus, RefreshCw } from 'lucide-react';

import { AdminSectionHeader } from '@/app/admin/(dashboard)/_components/admin-section-header';
import { ConfirmDialog } from '@/components/common/feedback/confirm-dialog';
import { EmptyState } from '@/components/common/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { useAdminCategoriesManager } from '@/hooks/use-admin-categories-manager';
import type { AdminCategoryListResponse } from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';
import { cn } from '@/utils';

import { AdminCategoryCard } from './admin-category-card';
import { AdminCategoryEditorDialog } from './admin-category-editor-dialog';

interface AdminCategoriesViewProps {
  profile: AdminSessionProfile;
  initialCategories: AdminCategoryListResponse;
  className?: string;
}

/** Thin composition view for catalog category hierarchy management. */
export function AdminCategoriesView({
  profile,
  initialCategories,
  className,
}: AdminCategoriesViewProps) {
  const {
    items,
    isFetching,
    queryErrorMessage,
    refetch,
    formOpen,
    setFormOpen,
    formState,
    setFormState,
    formError,
    conflictBanner,
    fieldErrors,
    actionBanner,
    archiveTarget,
    setArchiveTarget,
    archiveError,
    isSaving,
    isPublishing,
    isArchiving,
    openCreateDialog,
    openEditDialog,
    handleNameChange,
    handleFormSubmit,
    handleQuickPublish,
    handleConfirmArchive,
    handleReloadLatest,
    requestArchive,
  } = useAdminCategoriesManager({
    profile,
    initialCategories,
  });

  return (
    <section className={cn('admin-section', className)}>
      <AdminSectionHeader
        title={ADMIN_CATALOG_COPY.CATEGORIES.TITLE}
        description={ADMIN_CATALOG_COPY.CATEGORIES.SUBTITLE}
        actions={
          <div className="admin-inline-actions">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={isFetching}
              loadingLabel={ADMIN_CATALOG_COPY.CATEGORIES.REFRESH}
              onClick={() => void refetch()}
            >
              <RefreshCw size={16} aria-hidden="true" />
              <span>{ADMIN_CATALOG_COPY.CATEGORIES.REFRESH}</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={openCreateDialog}
            >
              <Plus size={16} aria-hidden="true" />
              <span>{ADMIN_CATALOG_COPY.CATEGORIES.ADD_BUTTON}</span>
            </Button>
          </div>
        }
      />

      {actionBanner ? (
        <Feedback
          tone={actionBanner.tone}
          title={actionBanner.message}
          announce
        />
      ) : null}

      {queryErrorMessage ? (
        <Feedback tone="error" title={queryErrorMessage} announce />
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          tone="cream"
          className="admin-empty-card"
          title={ADMIN_CATALOG_COPY.CATEGORIES.EMPTY}
        />
      ) : (
        <div className="admin-list-stack">
          {items.map((category) => (
            <AdminCategoryCard
              key={category.id}
              category={category}
              isPublishing={isPublishing}
              onEdit={openEditDialog}
              onQuickPublish={(target) => void handleQuickPublish(target)}
              onRequestArchive={requestArchive}
            />
          ))}
        </div>
      )}

      <AdminCategoryEditorDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        formState={formState}
        items={items}
        conflictBanner={conflictBanner}
        formError={formError}
        fieldErrors={fieldErrors}
        isSaving={isSaving}
        onNameChange={handleNameChange}
        onFormStateChange={setFormState}
        onReloadLatest={handleReloadLatest}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
        title={ADMIN_CATALOG_COPY.CATEGORIES.ARCHIVE_CONFIRM_TITLE}
        description={ADMIN_CATALOG_COPY.CATEGORIES.ARCHIVE_CONFIRM_DESC}
        error={archiveError}
        confirmLabel={ADMIN_CATALOG_COPY.CATEGORIES.ARCHIVE_CONFIRM_SUBMIT}
        cancelLabel={ADMIN_CATALOG_COPY.CATEGORIES.CANCEL}
        isLoading={isArchiving}
        loadingLabel="Mengarsipkan..."
        onConfirm={() => void handleConfirmArchive()}
      >
        {archiveTarget ? (
          <p className="admin-row-title admin-wrap-text">
            {archiveTarget.name} (<code>{archiveTarget.slug}</code>)
          </p>
        ) : null}
      </ConfirmDialog>
    </section>
  );
}
