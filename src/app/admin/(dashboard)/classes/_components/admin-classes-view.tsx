'use client';

import { Plus, RefreshCw } from 'lucide-react';

import { AdminSectionHeader } from '@/app/admin/(dashboard)/_components/admin-section-header';
import { ConfirmDialog } from '@/components/common/feedback/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { useAdminClassesManager } from '@/hooks/use-admin-classes-manager';
import type { AdminSessionProfile } from '@/types/auth';
import type {
  AdminClassBranchOption,
  AdminClassProgramsListData,
  AdminClassSessionsListData,
} from '@/types/classes';
import { cn } from '@/utils';

import { AdminClassProgramsSection } from './admin-class-programs-section';
import { AdminClassSessionsSection } from './admin-class-sessions-section';

interface AdminClassesViewProps {
  profile: AdminSessionProfile;
  initialPrograms: AdminClassProgramsListData;
  initialSessions: AdminClassSessionsListData;
  branches: AdminClassBranchOption[];
  className?: string;
}

export function AdminClassesView({
  profile,
  initialPrograms,
  initialSessions,
  branches,
  className,
}: AdminClassesViewProps) {
  const mgr = useAdminClassesManager({
    profile,
    initialPrograms,
    initialSessions,
    branches,
  });

  return (
    <div className={cn('admin-page-stack', className)}>
      <Card tone="surface" className="admin-section-card">
        <AdminSectionHeader
          eyebrow="ROK Baking Class · R21"
          headingAs="h1"
          title={ADMIN_CATALOG_COPY.CLASSES.TITLE}
          descriptionClassName="admin-section-desc"
          description={
            mgr.isOwner
              ? ADMIN_CATALOG_COPY.CLASSES.SUBTITLE_OWNER
              : ADMIN_CATALOG_COPY.CLASSES.SUBTITLE_STAFF
          }
          actions={
            <div className="admin-inline-actions">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={mgr.handleRefreshAll}
                disabled={mgr.isFetchingAny}
              >
                <RefreshCw size={16} aria-hidden="true" />
                {ADMIN_CATALOG_COPY.CLASSES.REFRESH}
              </Button>
              {mgr.isOwner ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={mgr.openNewProgramForm}
                >
                  <Plus size={16} aria-hidden="true" />
                  {ADMIN_CATALOG_COPY.CLASSES.ADD_PROGRAM}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={mgr.openNewSessionForm}
                disabled={mgr.selectableProgramsForSessions.length === 0}
              >
                <Plus size={16} aria-hidden="true" />
                {ADMIN_CATALOG_COPY.CLASSES.ADD_SESSION}
              </Button>
            </div>
          }
        />

        <div className="admin-classes-notices">
          <Feedback
            tone="info"
            title={ADMIN_CATALOG_COPY.CLASSES.PHOTO_CONSENT_RELEASE_GATE}
          />
          <Feedback
            tone="info"
            title={ADMIN_CATALOG_COPY.CLASSES.CAPACITY_MANUAL_NOTE}
          />
          {!mgr.isOwner ? (
            <Feedback
              tone="info"
              title={ADMIN_CATALOG_COPY.CLASSES.STAFF_PRICE_LOCK_NOTE}
            />
          ) : null}
        </div>
      </Card>

      <AdminClassProgramsSection
        isOwner={mgr.isOwner}
        programs={mgr.programs}
        programForm={mgr.programForm}
        setProgramForm={mgr.setProgramForm}
        isEditorOpen={mgr.isProgramEditorOpen}
        onCloseEditor={() => mgr.setIsProgramEditorOpen(false)}
        slugTouched={mgr.slugTouched}
        setSlugTouched={mgr.setSlugTouched}
        fieldErrors={mgr.programFieldErrors}
        feedback={mgr.programFeedback}
        isBusy={mgr.isProgramBusy}
        isUploading={mgr.isUploadingMedia}
        onNewProgram={mgr.openNewProgramForm}
        onEditProgram={mgr.openEditProgramForm}
        onArchiveProgram={(item) =>
          mgr.setConfirmAction({ kind: 'archive_program', item })
        }
        onUploadCover={mgr.handleUploadProgramCover}
        onSubmitProgram={mgr.handleSaveProgram}
      />

      <AdminClassSessionsSection
        isOwner={mgr.isOwner}
        isBranchLocked={mgr.isBranchLocked}
        branches={branches}
        programs={mgr.programs}
        selectablePrograms={mgr.selectableProgramsForSessions}
        sessions={mgr.sessions}
        filterBranchId={mgr.filterBranchId}
        onChangeFilterBranchId={mgr.setFilterBranchId}
        filterProgramId={mgr.filterProgramId}
        onChangeFilterProgramId={mgr.setFilterProgramId}
        sessionForm={mgr.sessionForm}
        setSessionForm={mgr.setSessionForm}
        isEditorOpen={mgr.isSessionEditorOpen}
        onCloseEditor={() => mgr.setIsSessionEditorOpen(false)}
        fieldErrors={mgr.sessionFieldErrors}
        feedback={mgr.sessionFeedback}
        isBusy={mgr.isSessionBusy}
        onNewSession={mgr.openNewSessionForm}
        onEditSession={mgr.openEditSessionForm}
        onMarkSessionFull={mgr.handleQuickMarkFull}
        onCancelSession={(item) =>
          mgr.setConfirmAction({ kind: 'cancel_session', item })
        }
        onSubmitSession={mgr.handleSaveSession}
      />

      <ConfirmDialog
        open={mgr.confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) mgr.setConfirmAction(null);
        }}
        title={
          mgr.confirmAction?.kind === 'archive_program'
            ? ADMIN_CATALOG_COPY.CLASSES.ARCHIVE_PROGRAM_TITLE
            : ADMIN_CATALOG_COPY.CLASSES.CANCEL_SESSION_TITLE
        }
        description={
          mgr.confirmAction?.kind === 'archive_program'
            ? ADMIN_CATALOG_COPY.CLASSES.ARCHIVE_PROGRAM_DESC
            : ADMIN_CATALOG_COPY.CLASSES.CANCEL_SESSION_DESC
        }
        cancelLabel="Batal"
        confirmLabel={
          mgr.confirmAction?.kind === 'archive_program'
            ? ADMIN_CATALOG_COPY.CLASSES.ARCHIVE_PROGRAM_SUBMIT
            : ADMIN_CATALOG_COPY.CLASSES.CANCEL_SESSION_SUBMIT
        }
        isLoading={mgr.isProgramBusy || mgr.isSessionBusy}
        actionsClassName="admin-inline-actions"
        onConfirm={mgr.handleConfirmDialogAction}
      />
    </div>
  );
}
