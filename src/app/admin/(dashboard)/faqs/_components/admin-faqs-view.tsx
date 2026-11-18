'use client';

import { CircleHelp, Plus, RefreshCw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { AdminSectionHeader } from '@/app/admin/(dashboard)/_components/admin-section-header';
import { ConfirmDialog } from '@/components/common/feedback/confirm-dialog';
import { EmptyState } from '@/components/common/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { useAdminFaqsManager } from '@/hooks/use-admin-faqs-manager';
import type {
  AdminFaqListResponse,
  AdminPublishingStatus,
} from '@/types/admin-cms';
import '@/styles/features/admin-faqs.css';
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

  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return visibleItems;
    return visibleItems.filter(
      (item) =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query),
    );
  }, [searchQuery, visibleItems]);

  return (
    <section
      className={cn('admin-section admin-faq-section', className)}
      aria-labelledby="admin-faqs-title"
    >
      <AdminSectionHeader
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
              <span>{ADMIN_CATALOG_COPY.FAQS.REFRESH}</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={openCreate}
            >
              <Plus size={16} aria-hidden="true" />
              <span>{ADMIN_CATALOG_COPY.FAQS.ADD_BUTTON}</span>
            </Button>
          </div>
        }
      />

      {actionError ? (
        <Feedback tone="error" title={actionError} announce />
      ) : null}

      <Card tone="surface" className="admin-faq-toolbar">
        <FormField id="faq-search" label="Cari FAQ">
          {(fieldProps) => (
            <div className="admin-faq-search-wrap">
              <Search
                size={15}
                className="admin-faq-search-icon"
                aria-hidden="true"
              />
              <Input
                {...fieldProps}
                type="search"
                sizeVariant="compact"
                value={searchQuery}
                placeholder="Cari pertanyaan, jawaban, atau kategori..."
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-faq-search-input"
              />
            </div>
          )}
        </FormField>

        <FormField id="faq-status-filter" label="Filter Status">
          {(fieldProps) => (
            <Select
              {...fieldProps}
              sizeVariant="compact"
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
      </Card>

      {filteredItems.length === 0 ? (
        <EmptyState
          tone="cream"
          icon={<CircleHelp size={24} strokeWidth={1.65} aria-hidden="true" />}
          title={ADMIN_CATALOG_COPY.FAQS.EMPTY}
        />
      ) : (
        <Card tone="surface" className="admin-faq-panel">
          <ul className="admin-faq-list">
            {filteredItems.map((item) => (
              <AdminFaqCard
                key={item.id}
                item={item}
                onEdit={openEdit}
                onPublish={(target) => void handleQuickPublish(target)}
                onArchive={setArchiveTarget}
              />
            ))}
          </ul>
        </Card>
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
