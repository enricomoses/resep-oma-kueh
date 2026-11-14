'use client';

import { type FormEvent, useState } from 'react';

import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ApiClientError, extractAdminMutationError } from '@/lib/errors';
import type {
  AdminCategoryItem,
  AdminCategoryListResponse,
  CategoryFormState,
} from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';
import {
  slugifyCatalogName,
  wouldCreateCategoryCycle,
} from '@/utils/admin-catalog';
import {
  createAdminCategorySchema,
  updateAdminCategorySchema,
} from '@/validations/admin-catalog.schema';

import {
  useAdminCategories,
  useArchiveAdminCategory,
  useCreateAdminCategory,
  useUpdateAdminCategory,
} from './use-admin-catalog';

interface UseAdminCategoriesManagerOptions {
  profile: AdminSessionProfile;
  initialCategories: AdminCategoryListResponse;
}

function createInitialFormState(): CategoryFormState {
  return {
    mode: 'create',
    id: null,
    name: '',
    slug: '',
    slugTouched: false,
    parentId: '',
    description: '',
    sortOrder: '0',
    status: 'draft',
    expectedUpdatedAt: null,
  };
}

/** Controller hook managing catalog categories CRUD, validation, cycle guard, and archive state. */
export function useAdminCategoriesManager({
  profile,
  initialCategories,
}: UseAdminCategoriesManagerOptions) {
  const categoriesQuery = useAdminCategories(profile, initialCategories);
  const createMutation = useCreateAdminCategory();
  const updateMutation = useUpdateAdminCategory();
  const archiveMutation = useArchiveAdminCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [formState, setFormState] = useState<CategoryFormState>(
    createInitialFormState,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [conflictBanner, setConflictBanner] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [actionBanner, setActionBanner] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<AdminCategoryItem | null>(
    null,
  );
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const items = categoriesQuery.data?.items ?? initialCategories.items;

  function openCreateDialog() {
    setFormState(createInitialFormState());
    setFormError(null);
    setConflictBanner(null);
    setFieldErrors({});
    setFormOpen(true);
  }

  function openEditDialog(category: AdminCategoryItem) {
    setFormState({
      mode: 'edit',
      id: category.id,
      name: category.name,
      slug: category.slug,
      slugTouched: true,
      parentId: category.parentId ?? '',
      description: category.description ?? '',
      sortOrder: String(category.sortOrder),
      status: category.status,
      expectedUpdatedAt: category.updatedAt,
    });
    setFormError(null);
    setConflictBanner(null);
    setFieldErrors({});
    setFormOpen(true);
  }

  function handleNameChange(nextName: string) {
    setFormState((prev) => ({
      ...prev,
      name: nextName,
      slug:
        prev.mode === 'create' && !prev.slugTouched
          ? slugifyCatalogName(nextName)
          : prev.slug,
    }));
  }

  function applyMutationError(err: unknown) {
    const parsed = extractAdminMutationError(
      err,
      'Terjadi kesalahan saat menyimpan kategori.',
    );
    if (err instanceof ApiClientError && err.code === 'CONFLICT') {
      setConflictBanner(parsed.message);
    }
    setFormError(parsed.message);
    if (Object.keys(parsed.fields).length > 0) {
      setFieldErrors(parsed.fields);
    }
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setConflictBanner(null);
    setFieldErrors({});
    setActionBanner(null);

    const parsedSortOrder = Number.parseInt(formState.sortOrder, 10);
    const parentId = formState.parentId.trim() || null;

    if (formState.mode === 'create') {
      const candidate = {
        name: formState.name,
        slug: formState.slug,
        parentId,
        description: formState.description || null,
        sortOrder: Number.isNaN(parsedSortOrder) ? -1 : parsedSortOrder,
        status: formState.status === 'published' ? 'published' : 'draft',
      };

      const parsed = createAdminCategorySchema.safeParse(candidate);
      if (!parsed.success) {
        const nextErrors: Record<string, string[]> = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path.join('.') || 'root';
          nextErrors[key] = [...(nextErrors[key] ?? []), issue.message];
        }
        setFieldErrors(nextErrors);
        setFormError('Periksa isian kategori.');
        return;
      }

      try {
        await createMutation.mutateAsync(parsed.data);
        setFormOpen(false);
        setActionBanner({
          tone: 'success',
          message: `Kategori "${parsed.data.name}" berhasil dibuat.`,
        });
      } catch (err) {
        applyMutationError(err);
      }
      return;
    }

    if (!formState.id || !formState.expectedUpdatedAt) return;

    if (
      wouldCreateCategoryCycle(
        formState.id,
        parentId,
        items.map((item) => ({ id: item.id, parentId: item.parentId })),
      )
    ) {
      const cycleMsg = ADMIN_CATALOG_COPY.CATEGORIES.ERRORS.CYCLE;
      setFieldErrors({ parentId: [cycleMsg] });
      setFormError(cycleMsg);
      return;
    }

    const candidate = {
      name: formState.name,
      parentId,
      description: formState.description || null,
      sortOrder: Number.isNaN(parsedSortOrder) ? -1 : parsedSortOrder,
      status: formState.status,
      expectedUpdatedAt: formState.expectedUpdatedAt,
    };

    const parsed = updateAdminCategorySchema.safeParse(candidate);
    if (!parsed.success) {
      const nextErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || 'root';
        nextErrors[key] = [...(nextErrors[key] ?? []), issue.message];
      }
      setFieldErrors(nextErrors);
      setFormError('Periksa perubahan kategori.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: formState.id,
        payload: parsed.data,
      });
      setFormOpen(false);
      setActionBanner({
        tone: 'success',
        message: `Kategori "${parsed.data.name}" berhasil diperbarui.`,
      });
    } catch (err) {
      applyMutationError(err);
    }
  }

  async function handleQuickPublish(category: AdminCategoryItem) {
    setActionBanner(null);
    try {
      await updateMutation.mutateAsync({
        id: category.id,
        payload: {
          name: category.name,
          parentId: category.parentId,
          description: category.description,
          sortOrder: category.sortOrder,
          status: 'published',
          expectedUpdatedAt: category.updatedAt,
        },
      });
      setActionBanner({
        tone: 'success',
        message: `Kategori "${category.name}" sekarang terpublikasi.`,
      });
    } catch (err) {
      setActionBanner({
        tone: 'error',
        message: extractAdminMutationError(
          err,
          'Gagal mempublikasikan kategori.',
        ).message,
      });
    }
  }

  async function handleConfirmArchive() {
    if (!archiveTarget) return;
    setArchiveError(null);
    setActionBanner(null);
    try {
      await archiveMutation.mutateAsync({
        id: archiveTarget.id,
        payload: { expectedUpdatedAt: archiveTarget.updatedAt },
      });
      setActionBanner({
        tone: 'success',
        message: `Kategori "${archiveTarget.name}" telah diarsipkan.`,
      });
      setArchiveTarget(null);
    } catch (err) {
      setArchiveError(
        extractAdminMutationError(err, 'Gagal mengarsipkan kategori.').message,
      );
    }
  }

  async function handleReloadLatest() {
    const res = await categoriesQuery.refetch();
    const latest = res.data?.items.find((cat) => cat.id === formState.id);
    if (latest) {
      openEditDialog(latest);
    }
  }

  function requestArchive(target: AdminCategoryItem) {
    setArchiveError(null);
    setArchiveTarget(target);
  }

  return {
    items,
    isFetching: categoriesQuery.isFetching,
    queryErrorMessage:
      categoriesQuery.error instanceof ApiClientError
        ? categoriesQuery.error.message
        : null,
    refetch: categoriesQuery.refetch,
    formOpen,
    setFormOpen,
    formState,
    setFormState,
    formError,
    conflictBanner,
    fieldErrors,
    actionBanner,
    archiveTarget,
    setArchiveTarget,
    archiveError,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isPublishing: updateMutation.isPending,
    isArchiving: archiveMutation.isPending,
    openCreateDialog,
    openEditDialog,
    handleNameChange,
    handleFormSubmit,
    handleQuickPublish,
    handleConfirmArchive,
    handleReloadLatest,
    requestArchive,
  };
}
