'use client';

import { FileText, ShieldAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import type {
  AdminCmsContentStatus,
  AdminCmsEntry,
  CmsDraftFormState,
} from '@/types/admin-cms';
import { cn } from '@/utils';
import { CMS_KEY_LABELS, supportsCmsSingleMedia } from '@/utils/admin-cms';

import { AdminCmsInstagramEditor } from './admin-cms-instagram-editor';
import { AdminCmsMediaFields } from './admin-cms-media-fields';
import { AdminCmsTextFields } from './admin-cms-text-fields';
import { AdminCmsValuesEditor } from './admin-cms-values-editor';

interface AdminCmsEntryEditorProps {
  activeEntry: AdminCmsEntry | null;
  form: CmsDraftFormState | null;
  isUploading: boolean;
  isSaving: boolean;
  getError: (field: string) => string | undefined;
  onChangeForm: (next: CmsDraftFormState) => void;
  onMainImageUpload: (file: File | undefined) => void;
  onInstagramImageUpload: (index: number, file: File | undefined) => void;
  onSave: (targetStatus: AdminCmsContentStatus) => void;
  className?: string;
}

/** Editor card composing key-specific CMS fieldsets, media uploaders, and save/publish controls. */
export function AdminCmsEntryEditor({
  activeEntry,
  form,
  isUploading,
  isSaving,
  getError,
  onChangeForm,
  onMainImageUpload,
  onInstagramImageUpload,
  onSave,
  className,
}: AdminCmsEntryEditorProps) {
  const supportsSingleMedia = supportsCmsSingleMedia(form?.key);

  return (
    <Card tone="cream" className={cn('admin-cms-editor-card', className)}>
      {!form || !activeEntry ? (
        <p className="admin-section-subtitle">Memuat skema konten CMS...</p>
      ) : (
        <div className="admin-cms-editor-stack">
          <div className="admin-card-head">
            <div>
              <h3 className="admin-card-title">
                <FileText
                  size={18}
                  aria-hidden="true"
                  className="mr-1 inline"
                />
                {CMS_KEY_LABELS[form.key]}
              </h3>
              <p className="admin-section-subtitle">
                Kunci: <code>{form.key}</code> ·{' '}
                {activeEntry.isPersisted ? 'Tersimpan di DB' : 'Template Awal'}
                {activeEntry.updatedAt
                  ? ` · Diperbarui ${new Date(activeEntry.updatedAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`
                  : ''}
              </p>
            </div>
            <Badge
              tone={activeEntry.status === 'published' ? 'success' : 'accent'}
            >
              {activeEntry.status === 'published' ? 'Terpublikasi' : 'Draf'}
            </Badge>
          </div>

          {activeEntry.releaseWarnings.length > 0 ? (
            <Feedback tone="info" title="Catatan Review Owner & Release Gate">
              <ul className="list-disc pl-4 text-xs">
                {activeEntry.releaseWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </Feedback>
          ) : null}

          <AdminCmsTextFields
            form={form}
            getError={getError}
            onChangeForm={onChangeForm}
          />

          {supportsSingleMedia ? (
            <AdminCmsMediaFields
              form={form}
              isUploading={isUploading}
              getError={getError}
              onChangeForm={onChangeForm}
              onUploadFile={onMainImageUpload}
            />
          ) : null}

          {form.key === 'about.values' ? (
            <AdminCmsValuesEditor
              form={form}
              errorMessage={getError('items')}
              onChangeForm={onChangeForm}
            />
          ) : null}

          {form.key === 'community.instagram' ? (
            <AdminCmsInstagramEditor
              form={form}
              getError={getError}
              onChangeForm={onChangeForm}
              onUploadItemImage={onInstagramImageUpload}
            />
          ) : null}

          <div className="admin-inline-actions pt-2">
            <Button
              type="button"
              variant="secondary"
              loading={isSaving}
              loadingLabel="Menyimpan..."
              onClick={() => onSave('draft')}
            >
              {ADMIN_CATALOG_COPY.CMS.SAVE_DRAFT}
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={isSaving}
              loadingLabel="Mempublikasikan..."
              onClick={() => onSave('published')}
            >
              <ShieldAlert size={16} aria-hidden="true" />
              {ADMIN_CATALOG_COPY.CMS.PUBLISH}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
