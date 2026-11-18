'use client';

import { FolderTree, Plus, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { AdminSectionHeader } from '@/app/admin/(dashboard)/_components/admin-section-header';
import { ConfirmDialog } from '@/components/common/feedback/confirm-dialog';
import { EmptyState } from '@/components/common/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { useAdminCategoriesManager } from '@/hooks/use-admin-categories-manager';
import '@/styles/features/admin-categories.css';
import type { AdminCategoryListResponse } from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';
import { cn } from '@/utils';

import { AdminCategoryCard } from './admin-category-card';
import { AdminCategoryEditorDialog } from './admin-category-editor-dialog';
import {
  AdminCategoryToolbar,
  type CategoryStatusFilter,
} from './admin-category-toolbar';

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

  const [statusFilter, setStatusFilter] = useState<CategoryStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const statusCounts = useMemo(() => {
    let published = 0;
    let draft = 0;
    let archived = 0;
    for (const item of items) {
      if (item.status === 'published') published += 1;
      else if (item.status === 'draft') draft += 1;
      else archived += 1;
    }
    return {
      all: items.length,
      published,
      draft,
      archived,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.slug.toLowerCase().includes(query) ||
        (item.parentName?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [items, searchQuery, statusFilter]);

  return (
    <section className={cn('admin-section admin-cat-section', className)}>
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

      {queryErrorMessage ? (
        <Feedback tone="error" title={queryErrorMessage} announce />
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          tone="cream"
          icon={<FolderTree size={24} strokeWidth={1.65} aria-hidden="true" />}
          title={ADMIN_CATALOG_COPY.CATEGORIES.EMPTY}
        />
      ) : (
        <>
          <AdminCategoryToolbar
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            counts={statusCounts}
          />

          <Card tone="surface" className="admin-cat-panel">
            {filteredItems.length === 0 ? (
              <div className="admin-cat-filter-empty">
                <p className="admin-row-meta">
                  Tidak ada kategori yang sesuai dengan filter atau pencarian.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setSearchQuery('');
                  }}
                >
                  Reset filter
                </Button>
              </div>
            ) : (
              <>
                <div className="admin-cat-list-head" aria-hidden="true">
                  <span>Kategori</span>
                  <span>Status</span>
                  <span>Urutan</span>
                  <span>Referensi</span>
                  <span>Aksi</span>
                </div>
                <ul className="admin-cat-list">
                  {filteredItems.map((category) => (
                    <AdminCategoryCard
                      key={category.id}
                      category={category}
                      isPublishing={isPublishing}
                      onEdit={openEditDialog}
                      onQuickPublish={(target) =>
                        void handleQuickPublish(target)
                      }
                      onRequestArchive={requestArchive}
                    />
                  ))}
                </ul>
              </>
            )}
          </Card>
        </>
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
