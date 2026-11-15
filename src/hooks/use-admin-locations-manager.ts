'use client';

import { useState } from 'react';

import { extractAdminMutationError } from '@/lib/errors';
import { notifyError, notifySuccess } from '@/lib/toast';
import type {
  AdminBranchesResponse,
  ReplaceBranchHoursInput,
  UpdateAdminBranchInput,
} from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';

import {
  useAdminBranches,
  useReplaceAdminBranchHours,
  useUpdateAdminBranch,
} from '@/hooks/queries/use-admin-catalog';

interface UseAdminLocationsManagerOptions {
  profile: AdminSessionProfile;
  initialData: AdminBranchesResponse;
}

/** Controller hook managing branch tab selection, profile updates, and operating hours saves. */
export function useAdminLocationsManager({
  profile,
  initialData,
}: UseAdminLocationsManagerOptions) {
  const branchesQuery = useAdminBranches(profile, initialData);
  const updateBranchMutation = useUpdateAdminBranch();
  const replaceHoursMutation = useReplaceAdminBranchHours();

  const data = branchesQuery.data ?? initialData;
  const branches = data.branches;

  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    branches[0]?.id ?? '',
  );
  const [profileServerError, setProfileServerError] = useState<string | null>(
    null,
  );
  const [profileFieldErrors, setProfileFieldErrors] = useState<
    Record<string, string[]>
  >({});
  const [hoursServerError, setHoursServerError] = useState<string | null>(null);

  const selectedBranch =
    branches.find((item) => item.id === selectedBranchId) ??
    branches[0] ??
    null;

  const loadErrorMessage = branchesQuery.error
    ? extractAdminMutationError(
        branchesQuery.error,
        'Gagal memuat daftar cabang.',
      ).message
    : null;

  function handleSelectBranch(branchId: string) {
    setSelectedBranchId(branchId);
    setProfileServerError(null);
    setProfileFieldErrors({});
    setHoursServerError(null);
  }

  async function handleRefresh() {
    await branchesQuery.refetch();
  }

  async function handleSaveBranch(payload: UpdateAdminBranchInput) {
    if (!selectedBranch) {
      return;
    }
    setProfileServerError(null);
    setProfileFieldErrors({});

    try {
      const response = await updateBranchMutation.mutateAsync({
        branchId: selectedBranch.id,
        payload,
      });
      notifySuccess(
        `Pengaturan cabang ${response.data.branch.name} berhasil disimpan.`,
        { toastId: 'admin-location-saved' },
      );
    } catch (error) {
      const parsed = extractAdminMutationError(
        error,
        'Gagal menyimpan pengaturan cabang.',
      );
      setProfileServerError(parsed.message);
      setProfileFieldErrors(parsed.fields);
      notifyError(parsed.message, { toastId: 'admin-location-error' });
      if (parsed.isConflict) {
        void branchesQuery.refetch();
      }
    }
  }

  async function handleSaveHours(payload: ReplaceBranchHoursInput) {
    if (!selectedBranch) {
      return;
    }
    setHoursServerError(null);

    try {
      const response = await replaceHoursMutation.mutateAsync({
        branchId: selectedBranch.id,
        payload,
      });
      notifySuccess(
        `Jam operasional ${response.data.branch.name} berhasil diperbarui.`,
        { toastId: 'admin-hours-saved' },
      );
    } catch (error) {
      const parsed = extractAdminMutationError(
        error,
        'Gagal menyimpan jam operasional cabang.',
      );
      setHoursServerError(parsed.message);
      notifyError(parsed.message, { toastId: 'admin-hours-error' });
      if (parsed.isConflict) {
        void branchesQuery.refetch();
      }
    }
  }

  return {
    branches,
    approvedContacts: data.approvedContacts,
    selectedBranch,
    isRefreshing: branchesQuery.isFetching,
    loadErrorMessage,
    profileServerError,
    profileFieldErrors,
    hoursServerError,
    isSavingProfile: updateBranchMutation.isPending,
    isSavingHours: replaceHoursMutation.isPending,
    handleSelectBranch,
    handleRefresh,
    handleSaveBranch,
    handleSaveHours,
  };
}
