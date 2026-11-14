import { Plus } from 'lucide-react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';

import { AdminSectionHeader } from '@/app/admin/(dashboard)/_components/admin-section-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import type { AdminClassProgramItem, ProgramFormState } from '@/types/classes';

import { AdminClassProgramCard } from './admin-class-program-card';
import { AdminClassProgramForm } from './admin-class-program-form';

interface AdminClassProgramsSectionProps {
  isOwner: boolean;
  programs: AdminClassProgramItem[];
  programForm: ProgramFormState;
  setProgramForm: Dispatch<SetStateAction<ProgramFormState>>;
  isEditorOpen: boolean;
  onCloseEditor: () => void;
  slugTouched: boolean;
  setSlugTouched: (touched: boolean) => void;
  fieldErrors: Record<string, string[]>;
  feedback: { tone: 'success' | 'error'; message: string } | null;
  isBusy: boolean;
  isUploading: boolean;
  onNewProgram: () => void;
  onEditProgram: (item: AdminClassProgramItem) => void;
  onArchiveProgram: (item: AdminClassProgramItem) => void;
  onUploadCover: (file: File | null) => void;
  onSubmitProgram: (event: FormEvent<HTMLFormElement>) => void;
}

/**
 * Renders the admin baking class programs section with editor drawer and program cards.
 */
export function AdminClassProgramsSection({
  isOwner,
  programs,
  programForm,
  setProgramForm,
  isEditorOpen,
  onCloseEditor,
  slugTouched,
  setSlugTouched,
  fieldErrors,
  feedback,
  isBusy,
  isUploading,
  onNewProgram,
  onEditProgram,
  onArchiveProgram,
  onUploadCover,
  onSubmitProgram,
}: AdminClassProgramsSectionProps) {
  return (
    <Card tone="surface" className="admin-section-card">
      <AdminSectionHeader
        title="Program Kelas Baking"
        titleClassName="admin-panel-title"
        descriptionClassName="admin-panel-desc"
        description={
          isOwner
            ? 'Publikasi program memerlukan deskripsi lengkap, review Owner selesai, dan foto cover berstatus disetujui.'
            : 'Menampilkan program kelas berstatus terpublikasi dan disetujui Owner untuk penjadwalan sesi cabang Anda.'
        }
        actions={
          isOwner ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onNewProgram}
            >
              <Plus size={16} aria-hidden="true" />
              {ADMIN_CATALOG_COPY.CLASSES.ADD_PROGRAM}
            </Button>
          ) : null
        }
      />

      {feedback ? (
        <Feedback tone={feedback.tone} title={feedback.message} announce />
      ) : null}

      {isOwner && isEditorOpen ? (
        <AdminClassProgramForm
          form={programForm}
          setForm={setProgramForm}
          slugTouched={slugTouched}
          setSlugTouched={setSlugTouched}
          fieldErrors={fieldErrors}
          isBusy={isBusy}
          isUploading={isUploading}
          onUploadCover={onUploadCover}
          onSubmit={onSubmitProgram}
          onClose={onCloseEditor}
        />
      ) : null}

      {programs.length === 0 ? (
        <p className="admin-empty-copy">
          {ADMIN_CATALOG_COPY.CLASSES.EMPTY_PROGRAMS}
        </p>
      ) : (
        <div className="admin-classes-list">
          {programs.map((program) => (
            <AdminClassProgramCard
              key={program.id}
              program={program}
              isOwner={isOwner}
              onEdit={onEditProgram}
              onArchive={onArchiveProgram}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
