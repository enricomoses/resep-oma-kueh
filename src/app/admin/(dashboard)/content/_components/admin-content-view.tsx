'use client';

import { RefreshCw } from 'lucide-react';

import { AdminSectionHeader } from '@/app/admin/(dashboard)/_components/admin-section-header';
import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { useAdminContentManager } from '@/hooks/use-admin-content-manager';
import type { AdminCmsListResponse } from '@/types/admin-cms';
import type { AdminSessionProfile } from '@/types/auth';
import { cn } from '@/utils';

import { AdminCmsEntryEditor } from './admin-cms-entry-editor';
import { AdminCmsKeyList } from './admin-cms-key-list';

interface AdminContentViewProps {
  profile: AdminSessionProfile;
  initialData?: AdminCmsListResponse;
  className?: string;
}

/** CMS content management view for editing & publishing storefront entries. */
export function AdminContentView({
  profile,
  initialData,
  className,
}: AdminContentViewProps) {
  const {
    entries,
    activeEntry,
    currentForm,
    setFormState,
    isRefreshing,
    isUploading,
    isSaving,
    actionError,
    rootError,
    successMessage,
    handleSelectKey,
    handleRefresh,
    handleMainImageUpload,
    handleInstagramImageUpload,
    handleSave,
    getError,
  } = useAdminContentManager({ profile, initialData });

  return (
    <section
      className={cn('admin-module-page', className)}
      aria-labelledby="admin-content-title"
    >
      <AdminSectionHeader
        title={ADMIN_CATALOG_COPY.CMS.TITLE}
        description={ADMIN_CATALOG_COPY.CMS.SUBTITLE}
        titleId="admin-content-title"
        className="admin-module-header"
        actions={
          <div className="admin-inline-actions">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void handleRefresh()}
              loading={isRefreshing}
            >
              <RefreshCw size={16} aria-hidden="true" />
              {ADMIN_CATALOG_COPY.CMS.REFRESH}
            </Button>
          </div>
        }
      />

      {actionError ? (
        <Feedback tone="error" title={actionError} announce>
          {rootError ? <p>{rootError}</p> : null}
        </Feedback>
      ) : null}

      {successMessage ? (
        <Feedback tone="success" title={successMessage} announce />
      ) : null}

      <div className="admin-cms-layout">
        <AdminCmsKeyList
          entries={entries}
          activeKey={currentForm?.key}
          onSelectKey={handleSelectKey}
        />

        <AdminCmsEntryEditor
          activeEntry={activeEntry}
          form={currentForm}
          isUploading={isUploading}
          isSaving={isSaving}
          getError={getError}
          onChangeForm={setFormState}
          onMainImageUpload={(file) => void handleMainImageUpload(file)}
          onInstagramImageUpload={(idx, file) =>
            void handleInstagramImageUpload(idx, file)
          }
          onSave={(status) => void handleSave(status)}
        />
      </div>
    </section>
  );
}
