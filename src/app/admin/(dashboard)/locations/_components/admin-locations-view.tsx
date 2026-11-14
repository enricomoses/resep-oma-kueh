'use client';

import { RefreshCw } from 'lucide-react';

import { AdminSectionHeader } from '@/app/admin/(dashboard)/_components/admin-section-header';
import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { useAdminLocationsManager } from '@/hooks/use-admin-locations-manager';
import type { AdminBranchesResponse } from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';
import { cn } from '@/utils';

import { AdminBranchHoursEditor } from './admin-branch-hours-editor';
import { AdminBranchProfileForm } from './admin-branch-profile-form';
import { AdminBranchReadinessCard } from './admin-branch-readiness-card';

interface AdminLocationsViewProps {
  profile: AdminSessionProfile;
  initialData: AdminBranchesResponse;
  className?: string;
}

/** Branch profile and operating-hours management view. */
export function AdminLocationsView({
  profile,
  initialData,
  className,
}: AdminLocationsViewProps) {
  const {
    branches,
    approvedContacts,
    selectedBranch,
    isRefreshing,
    loadErrorMessage,
    actionBanner,
    profileServerError,
    profileFieldErrors,
    hoursServerError,
    isSavingProfile,
    isSavingHours,
    handleSelectBranch,
    handleRefresh,
    handleSaveBranch,
    handleSaveHours,
  } = useAdminLocationsManager({ profile, initialData });

  return (
    <section className={cn('admin-section', className)}>
      <AdminSectionHeader
        title={ADMIN_CATALOG_COPY.LOCATIONS.TITLE}
        description={ADMIN_CATALOG_COPY.LOCATIONS.SUBTITLE}
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={isRefreshing}
            loadingLabel="Memuat ulang cabang..."
            onClick={() => void handleRefresh()}
          >
            <RefreshCw size={16} aria-hidden="true" />
            <span>Muat Ulang</span>
          </Button>
        }
      />

      <AdminBranchReadinessCard
        branches={branches}
        bintaroAddressResolved={approvedContacts.bintaroAddressResolved}
      />

      {actionBanner ? (
        <Feedback
          tone={actionBanner.tone}
          title={actionBanner.message}
          announce
        />
      ) : null}

      {loadErrorMessage ? (
        <Feedback tone="error" title={loadErrorMessage} announce />
      ) : null}

      <div
        className="admin-inline-actions"
        role="tablist"
        aria-label="Pilih cabang"
      >
        {branches.map((branch) => {
          const active = selectedBranch?.id === branch.id;
          return (
            <Button
              key={branch.id}
              type="button"
              role="tab"
              aria-selected={active}
              variant={active ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleSelectBranch(branch.id)}
            >
              <span>
                {branch.name} ({branch.city})
              </span>
            </Button>
          );
        })}
      </div>

      {selectedBranch ? (
        <div className="admin-locations-stack">
          <AdminBranchProfileForm
            key={`profile-${selectedBranch.id}-${selectedBranch.updatedAt}`}
            branch={selectedBranch}
            isPending={isSavingProfile}
            serverError={profileServerError}
            serverFieldErrors={profileFieldErrors}
            onSave={handleSaveBranch}
          />
          <AdminBranchHoursEditor
            key={`hours-${selectedBranch.id}-${selectedBranch.updatedAt}`}
            branch={selectedBranch}
            isPending={isSavingHours}
            serverError={hoursServerError}
            onSaveHours={handleSaveHours}
          />
        </div>
      ) : null}
    </section>
  );
}
