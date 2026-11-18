import { CalendarDays, Plus } from 'lucide-react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';

import { AdminSectionHeader } from '@/app/admin/(dashboard)/_components/admin-section-header';
import { EmptyState } from '@/components/common/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  isBusy: boolean;
  isUploading: boolean;
  onNewProgram: () => void;
  onEditProgram: (item: AdminClassProgramItem) => void;
  onArchiveProgram: (item: AdminClassProgramItem) => void;
  onUploadCover: (file: File | null) => void;
  onSubmitProgram: (event: FormEvent<HTMLFormElement>) => void;
}

/**
 * Renders the admin baking class programs section with editor panel and program directory.
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
  isBusy,
  isUploading,
  onNewProgram,
  onEditProgram,
  onArchiveProgram,
  onUploadCover,
  onSubmitProgram,
}: AdminClassProgramsSectionProps) {
  return (
    <Card tone="surface" className="admin-classes-panel">
      <AdminSectionHeader
        headingAs="h2"
        title="Program Kelas Baking"
        titleClassName="admin-classes-panel-title"
        descriptionClassName="admin-classes-panel-desc"
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
              <span>{ADMIN_CATALOG_COPY.CLASSES.ADD_PROGRAM}</span>
            </Button>
          ) : null
        }
      />

      {isOwner ? (
        <AdminClassProgramForm
          open={isEditorOpen}
          onOpenChange={(open) => {
            if (!open) onCloseEditor();
          }}
          form={programForm}
          setForm={setProgramForm}
          slugTouched={slugTouched}
          setSlugTouched={setSlugTouched}
          fieldErrors={fieldErrors}
          isBusy={isBusy}
          isUploading={isUploading}
          onUploadCover={onUploadCover}
          onSubmit={onSubmitProgram}
        />
      ) : null}

      {programs.length === 0 ? (
        <EmptyState
          size="sm"
          tone="cream"
          headingAs="h3"
          icon={
            <CalendarDays size={20} strokeWidth={1.65} aria-hidden="true" />
          }
          title={ADMIN_CATALOG_COPY.CLASSES.EMPTY_PROGRAMS}
        />
      ) : (
        <ul className="admin-classes-list">
          {programs.map((program) => (
            <AdminClassProgramCard
              key={program.id}
              program={program}
              isOwner={isOwner}
              onEdit={onEditProgram}
              onArchive={onArchiveProgram}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}
