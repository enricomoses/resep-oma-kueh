'use client';

import { useState } from 'react';

import type {
  AdminBranchesResponse,
  ReplaceBranchHoursInput,
  UpdateAdminBranchInput,
} from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';

import { extractAdminMutationError } from './admin-mutation-error';
import {
  useAdminBranches,
  useReplaceAdminBranchHours,
  useUpdateAdminBranch,
} from './use-admin-catalog';

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
  const [actionBanner, setActionBanner] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
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
    setActionBanner(null);
  }

  async function handleRefresh() {
    await branchesQuery.refetch();
  }

  async function handleSaveBranch(payload: UpdateAdminBranchInput) {
    if (!selectedBranch) {
      return;
    }
    setActionBanner(null);
    setProfileServerError(null);
    setProfileFieldErrors({});

    try {
      const response = await updateBranchMutation.mutateAsync({
        branchId: selectedBranch.id,
        payload,
      });
      setActionBanner({
        tone: 'success',
        message: `Pengaturan cabang ${response.data.branch.name} berhasil disimpan.`,
      });
    } catch (error) {
      const parsed = extractAdminMutationError(
        error,
        'Gagal menyimpan pengaturan cabang.',
      );
      setProfileServerError(parsed.message);
      setProfileFieldErrors(parsed.fields);
      if (parsed.isConflict) {
        void branchesQuery.refetch();
      }
    }
  }

  async function handleSaveHours(payload: ReplaceBranchHoursInput) {
    if (!selectedBranch) {
      return;
    }
    setActionBanner(null);
    setHoursServerError(null);

    try {
      const response = await replaceHoursMutation.mutateAsync({
        branchId: selectedBranch.id,
        payload,
      });
      setActionBanner({
        tone: 'success',
        message: `Jam operasional ${response.data.branch.name} berhasil diperbarui.`,
      });
    } catch (error) {
      const parsed = extractAdminMutationError(
        error,
        'Gagal menyimpan jam operasional cabang.',
      );
      setHoursServerError(parsed.message);
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
    actionBanner,
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
