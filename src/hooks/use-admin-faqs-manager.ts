'use client';

import { type FormEvent, useMemo, useState } from 'react';

import type { AdminSessionProfile } from '@/types/auth';
import type {
  AdminFaqItem,
  AdminFaqListResponse,
  AdminPublishingStatus,
  FaqFormState,
} from '@/types/admin-cms';

import { extractAdminMutationError } from './admin-mutation-error';
import {
  useAdminFaqs,
  useArchiveAdminFaq,
  useCreateAdminFaq,
  useUpdateAdminFaq,
} from './use-admin-cms';

interface UseAdminFaqsManagerOptions {
  profile: AdminSessionProfile;
  initialData?: AdminFaqListResponse;
}

const EMPTY_FORM: FaqFormState = {
  id: null,
  expectedUpdatedAt: null,
  category: 'Pemesanan',
  question: '',
  answer: '',
  sortOrder: '0',
  status: 'draft',
};

function faqToForm(item: AdminFaqItem): FaqFormState {
  return {
    id: item.id,
    expectedUpdatedAt: item.updatedAt,
    category: item.category,
    question: item.question,
    answer: item.answer,
    sortOrder: String(item.sortOrder),
    status: item.status,
  };
}

/** Controller hook managing FAQ status filtering, create/edit modal state, publish, and archive. */
export function useAdminFaqsManager({
  profile,
  initialData,
}: UseAdminFaqsManagerOptions) {
  const faqsQuery = useAdminFaqs(profile, initialData);
  const createMutation = useCreateAdminFaq();
  const updateMutation = useUpdateAdminFaq();
  const archiveMutation = useArchiveAdminFaq();

  const [statusFilter, setStatusFilter] = useState<
    'all' | AdminPublishingStatus
  >('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<FaqFormState>(EMPTY_FORM);
  const [archiveTarget, setArchiveTarget] = useState<AdminFaqItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const items = useMemo(() => faqsQuery.data?.items ?? [], [faqsQuery.data]);
  const visibleItems = useMemo(
    () =>
      items.filter((item) =>
        statusFilter === 'all' ? true : item.status === statusFilter,
      ),
    [items, statusFilter],
  );

  function openCreate() {
    setActionError(null);
    setFieldErrors({});
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  }

  function openEdit(item: AdminFaqItem) {
    setActionError(null);
    setFieldErrors({});
    setForm(faqToForm(item));
    setEditorOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    const parsedSortOrder = Number.parseInt(form.sortOrder, 10);
    const sortOrder = Number.isFinite(parsedSortOrder) ? parsedSortOrder : 0;

    try {
      if (form.id && form.expectedUpdatedAt) {
        await updateMutation.mutateAsync({
          faqId: form.id,
          payload: {
            category: form.category.trim(),
            question: form.question.trim(),
            answer: form.answer.trim(),
            sortOrder,
            status: form.status,
            expectedUpdatedAt: form.expectedUpdatedAt,
          },
        });
        setSuccessMessage('FAQ berhasil diperbarui.');
      } else {
        await createMutation.mutateAsync({
          category: form.category.trim(),
          question: form.question.trim(),
          answer: form.answer.trim(),
          sortOrder,
          status: form.status,
        });
        setSuccessMessage('FAQ baru berhasil dibuat.');
      }
      setEditorOpen(false);
    } catch (err) {
      const parsed = extractAdminMutationError(err, 'Gagal menyimpan FAQ.');
      setActionError(parsed.message);
      if (Object.keys(parsed.fields).length > 0) {
        setFieldErrors(parsed.fields);
      }
    }
  }

  async function handleQuickPublish(item: AdminFaqItem) {
    setActionError(null);
    try {
      await updateMutation.mutateAsync({
        faqId: item.id,
        payload: {
          category: item.category,
          question: item.question,
          answer: item.answer,
          sortOrder: item.sortOrder,
          status: 'published',
          expectedUpdatedAt: item.updatedAt,
        },
      });
      setSuccessMessage('FAQ berhasil dipublikasikan.');
    } catch (err) {
      setActionError(
        extractAdminMutationError(err, 'Gagal mempublikasikan FAQ.').message,
      );
    }
  }

  async function handleConfirmArchive() {
    if (!archiveTarget) return;
    setActionError(null);
    setSuccessMessage(null);
    try {
      await archiveMutation.mutateAsync({
        faqId: archiveTarget.id,
        payload: { expectedUpdatedAt: archiveTarget.updatedAt },
      });
      setArchiveTarget(null);
      setSuccessMessage(
        'FAQ berhasil diarsipkan dan disembunyikan dari publik.',
      );
    } catch (err) {
      setActionError(
        extractAdminMutationError(err, 'Gagal mengarsipkan FAQ.').message,
      );
    }
  }

  return {
    totalCount: items.length,
    visibleItems,
    isFetching: faqsQuery.isFetching,
    refetch: faqsQuery.refetch,
    statusFilter,
    setStatusFilter,
    editorOpen,
    setEditorOpen,
    form,
    setForm,
    archiveTarget,
    setArchiveTarget,
    actionError,
    fieldErrors,
    successMessage,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isArchiving: archiveMutation.isPending,
    openCreate,
    openEdit,
    handleSubmit,
    handleQuickPublish,
    handleConfirmArchive,
  };
}
