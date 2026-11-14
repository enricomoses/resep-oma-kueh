'use client';

import { useMemo, useState } from 'react';

import { extractAdminMutationError } from '@/lib/errors';
import type {
  AdminCmsContentStatus,
  AdminCmsListResponse,
  CmsDraftFormState,
} from '@/types/admin-cms';
import type { AdminSessionProfile } from '@/types/auth';
import type { PublicCmsKey } from '@/types/content';
import {
  buildContentPayloadFromForm,
  entryToFormState,
} from '@/utils/admin-cms';

import { useUploadAdminProductMedia } from './use-admin-catalog';
import { useAdminCmsEntries, useSaveAdminCmsEntry } from './use-admin-cms';

interface UseAdminContentManagerOptions {
  profile: AdminSessionProfile;
  initialData?: AdminCmsListResponse;
}

/** Controller hook managing CMS key selection, draft form state, image uploads, and publish saves. */
export function useAdminContentManager({
  profile,
  initialData,
}: UseAdminContentManagerOptions) {
  const cmsQuery = useAdminCmsEntries(profile, initialData);
  const saveMutation = useSaveAdminCmsEntry();
  const uploadMutation = useUploadAdminProductMedia();

  const entries = useMemo(() => cmsQuery.data?.items ?? [], [cmsQuery.data]);
  const [selectedKey, setSelectedKey] = useState<PublicCmsKey>('home.hero');
  const activeEntry = useMemo(
    () =>
      entries.find((item) => item.key === selectedKey) ?? entries[0] ?? null,
    [entries, selectedKey],
  );

  const [formState, setFormState] = useState<CmsDraftFormState | null>(() =>
    activeEntry ? entryToFormState(activeEntry) : null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currentForm =
    formState && formState.key === activeEntry?.key
      ? formState
      : activeEntry
        ? entryToFormState(activeEntry)
        : null;

  function handleSelectKey(key: PublicCmsKey) {
    setSelectedKey(key);
    setActionError(null);
    setFieldErrors({});
    setSuccessMessage(null);
    const found = entries.find((item) => item.key === key);
    if (found) {
      setFormState(entryToFormState(found));
    }
  }

  async function handleRefresh() {
    setActionError(null);
    const result = await cmsQuery.refetch();
    const refreshed = result.data?.items.find(
      (item) => item.key === selectedKey,
    );
    if (refreshed) {
      setFormState(entryToFormState(refreshed));
    }
  }

  async function handleMainImageUpload(file: File | undefined) {
    if (!file || !currentForm) return;
    setActionError(null);
    try {
      const response = await uploadMutation.mutateAsync(file);
      setFormState({
        ...currentForm,
        imagePath: response.data.storagePath,
        previewUrl: response.data.previewUrl,
        mediaApproved: true,
      });
    } catch (err) {
      const parsed = extractAdminMutationError(
        err,
        'Gagal mengunggah berkas foto.',
      );
      setActionError(parsed.message);
    }
  }

  async function handleInstagramImageUpload(
    index: number,
    file: File | undefined,
  ) {
    if (!file || !currentForm) return;
    setActionError(null);
    try {
      const response = await uploadMutation.mutateAsync(file);
      const next = [...currentForm.instagramItems];
      const existing = next[index];
      if (!existing) return;
      next[index] = {
        ...existing,
        image_path: response.data.storagePath,
        previewUrl: response.data.previewUrl,
        media_approved: true,
      };
      setFormState({
        ...currentForm,
        instagramItems: next,
      });
    } catch (err) {
      const parsed = extractAdminMutationError(
        err,
        'Gagal mengunggah berkas foto Instagram.',
      );
      setActionError(parsed.message);
    }
  }

  async function handleSave(targetStatus: AdminCmsContentStatus) {
    if (!currentForm) return;
    setActionError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    try {
      const response = await saveMutation.mutateAsync({
        key: currentForm.key,
        payload: {
          status: targetStatus,
          expectedUpdatedAt: currentForm.expectedUpdatedAt,
          content: buildContentPayloadFromForm(currentForm),
        },
      });
      setFormState(entryToFormState(response.data.item));
      setSuccessMessage(
        targetStatus === 'published'
          ? `Konten "${currentForm.key}" berhasil dipublikasikan.`
          : `Draf konten "${currentForm.key}" berhasil disimpan.`,
      );
    } catch (err) {
      const parsed = extractAdminMutationError(
        err,
        'Gagal menyimpan perubahan konten.',
      );
      setActionError(parsed.message);
      setFieldErrors(parsed.fields);
    }
  }

  function getError(field: string): string | undefined {
    return fieldErrors[field]?.[0];
  }

  return {
    entries,
    activeEntry,
    currentForm,
    setFormState,
    isRefreshing: cmsQuery.isFetching,
    isUploading: uploadMutation.isPending,
    isSaving: saveMutation.isPending,
    actionError,
    rootError: fieldErrors.root?.[0] ?? null,
    successMessage,
    handleSelectKey,
    handleRefresh,
    handleMainImageUpload,
    handleInstagramImageUpload,
    handleSave,
    getError,
  };
}
