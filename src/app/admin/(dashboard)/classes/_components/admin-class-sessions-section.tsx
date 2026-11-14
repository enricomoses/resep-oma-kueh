import { Plus } from 'lucide-react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';

import { AdminSectionHeader } from '@/app/admin/(dashboard)/_components/admin-section-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import type {
  AdminClassBranchOption,
  AdminClassProgramItem,
  AdminClassSessionItem,
  SessionFormState,
} from '@/types/classes';

import { AdminClassSessionCard } from './admin-class-session-card';
import { AdminClassSessionForm } from './admin-class-session-form';

interface AdminClassSessionsSectionProps {
  isOwner: boolean;
  isBranchLocked: boolean;
  branches: AdminClassBranchOption[];
  programs: AdminClassProgramItem[];
  selectablePrograms: AdminClassProgramItem[];
  sessions: AdminClassSessionItem[];
  filterBranchId: string;
  onChangeFilterBranchId: (branchId: string) => void;
  filterProgramId: string;
  onChangeFilterProgramId: (programId: string) => void;
  sessionForm: SessionFormState;
  setSessionForm: Dispatch<SetStateAction<SessionFormState>>;
  isEditorOpen: boolean;
  onCloseEditor: () => void;
  fieldErrors: Record<string, string[]>;
  feedback: { tone: 'success' | 'error'; message: string } | null;
  isBusy: boolean;
  onNewSession: () => void;
  onEditSession: (item: AdminClassSessionItem) => void;
  onMarkSessionFull: (item: AdminClassSessionItem) => void;
  onCancelSession: (item: AdminClassSessionItem) => void;
  onSubmitSession: (event: FormEvent<HTMLFormElement>) => void;
}

/**
 * Renders the branch class schedule filters, session editor form, and session list cards.
 */
export function AdminClassSessionsSection({
  isOwner,
  isBranchLocked,
  branches,
  programs,
  selectablePrograms,
  sessions,
  filterBranchId,
  onChangeFilterBranchId,
  filterProgramId,
  onChangeFilterProgramId,
  sessionForm,
  setSessionForm,
  isEditorOpen,
  onCloseEditor,
  fieldErrors,
  feedback,
  isBusy,
  onNewSession,
  onEditSession,
  onMarkSessionFull,
  onCancelSession,
  onSubmitSession,
}: AdminClassSessionsSectionProps) {
  return (
    <Card tone="surface" className="admin-section-card">
      <AdminSectionHeader
        title="Jadwal & Kapasitas Sesi Cabang"
        titleClassName="admin-panel-title"
        descriptionClassName="admin-panel-desc"
        description="Semua waktu diinput dalam zona WIB (Asia/Jakarta) dan disimpan sebagai UTC di database."
        actions={
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onNewSession}
            disabled={selectablePrograms.length === 0}
          >
            <Plus size={16} aria-hidden="true" />
            {ADMIN_CATALOG_COPY.CLASSES.ADD_SESSION}
          </Button>
        }
      />

      <div className="admin-form-grid-2">
        <FormField id="session-filter-branch" label="Filter Cabang">
          {(fieldProps) => (
            <Select
              {...fieldProps}
              value={filterBranchId}
              disabled={isBranchLocked}
              onChange={(event) => onChangeFilterBranchId(event.target.value)}
            >
              {isOwner ? <option value="">Semua Cabang</option> : null}
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                  {!branch.isActive ? ' (Nonaktif)' : ''}
                </option>
              ))}
            </Select>
          )}
        </FormField>

        <FormField id="session-filter-program" label="Filter Program Kelas">
          {(fieldProps) => (
            <Select
              {...fieldProps}
              value={filterProgramId}
              onChange={(event) => onChangeFilterProgramId(event.target.value)}
            >
              <option value="">Semua Program</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.title}
                </option>
              ))}
            </Select>
          )}
        </FormField>
      </div>

      {feedback ? (
        <Feedback tone={feedback.tone} title={feedback.message} announce />
      ) : null}

      {isEditorOpen ? (
        <AdminClassSessionForm
          form={sessionForm}
          setForm={setSessionForm}
          isOwner={isOwner}
          isBranchLocked={isBranchLocked}
          selectablePrograms={selectablePrograms}
          branches={branches}
          fieldErrors={fieldErrors}
          isBusy={isBusy}
          onSubmit={onSubmitSession}
          onClose={onCloseEditor}
        />
      ) : null}

      {sessions.length === 0 ? (
        <p className="admin-empty-copy">
          {ADMIN_CATALOG_COPY.CLASSES.EMPTY_SESSIONS}
        </p>
      ) : (
        <div className="admin-classes-list">
          {sessions.map((session) => (
            <AdminClassSessionCard
              key={session.id}
              session={session}
              isBusy={isBusy}
              onEdit={onEditSession}
              onMarkFull={onMarkSessionFull}
              onCancel={onCancelSession}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
