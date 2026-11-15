'use client';

import { type FormEvent, useMemo, useState } from 'react';

import { extractAdminMutationError } from '@/lib/errors';
import { notifyError, notifySuccess } from '@/lib/toast';
import type { AdminSessionProfile } from '@/types/auth';
import type {
  AdminTestimonialItem,
  AdminTestimonialListResponse,
  TestimonialFormState,
} from '@/types/admin-cms';

import {
  useAdminTestimonials,
  useArchiveAdminTestimonial,
  useCreateAdminTestimonial,
  useUpdateAdminTestimonial,
} from '@/hooks/queries/use-admin-cms';

interface UseAdminTestimonialsManagerOptions {
  profile: AdminSessionProfile;
  initialData?: AdminTestimonialListResponse;
}

const EMPTY_FORM: TestimonialFormState = {
  id: null,
  expectedUpdatedAt: null,
  displayName: 'Pelanggan Resep Oma',
  quote: '',
  rating: '',
  sourceLabel: 'Referensi historis — menunggu izin',
  sourceUrl: '',
  consentAt: '',
  consentReference: '',
  sortOrder: '0',
  status: 'draft',
};

function toDateInputValue(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function testimonialToForm(item: AdminTestimonialItem): TestimonialFormState {
  return {
    id: item.id,
    expectedUpdatedAt: item.updatedAt,
    displayName: item.displayName,
    quote: item.quote,
    rating: item.rating !== null ? String(item.rating) : '',
    sourceLabel: item.sourceLabel ?? '',
    sourceUrl: item.sourceUrl ?? '',
    consentAt: toDateInputValue(item.consentAt),
    consentReference: item.consentReference ?? '',
    sortOrder: String(item.sortOrder),
    status: item.status,
  };
}

/** Controller hook managing testimonial CRUD, consent-gated preview list, and archive dialog state. */
export function useAdminTestimonialsManager({
  profile,
  initialData,
}: UseAdminTestimonialsManagerOptions) {
  const query = useAdminTestimonials(profile, initialData);
  const createMutation = useCreateAdminTestimonial();
  const updateMutation = useUpdateAdminTestimonial();
  const archiveMutation = useArchiveAdminTestimonial();

  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<TestimonialFormState>(EMPTY_FORM);
  const [archiveTarget, setArchiveTarget] =
    useState<AdminTestimonialItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const items = useMemo(() => query.data?.items ?? [], [query.data]);
  const publishedConsented = useMemo(
    () =>
      items.filter(
        (item) =>
          item.status === 'published' &&
          Boolean(item.consentAt) &&
          Boolean(item.consentReference),
      ),
    [items],
  );

  function openCreate() {
    setActionError(null);
    setFieldErrors({});
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  }

  function openEdit(item: AdminTestimonialItem) {
    setActionError(null);
    setFieldErrors({});
    setForm(testimonialToForm(item));
    setEditorOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError(null);
    setFieldErrors({});

    const parsedRating =
      form.rating.trim().length > 0 ? Number.parseInt(form.rating, 10) : null;
    const parsedSortOrder = Number.parseInt(form.sortOrder, 10);

    const payloadBase = {
      displayName: form.displayName.trim() || 'Pelanggan Resep Oma',
      quote: form.quote.trim(),
      rating:
        parsedRating !== null && Number.isFinite(parsedRating)
          ? parsedRating
          : null,
      sourceLabel: form.sourceLabel.trim() || null,
      sourceUrl: form.sourceUrl.trim() || null,
      consentAt: form.consentAt.trim()
        ? `${form.consentAt.trim()}T00:00:00.000Z`
        : null,
      consentReference: form.consentReference.trim() || null,
      sortOrder: Number.isFinite(parsedSortOrder) ? parsedSortOrder : 0,
      status: form.status,
    };

    try {
      if (form.id && form.expectedUpdatedAt) {
        await updateMutation.mutateAsync({
          testimonialId: form.id,
          payload: {
            ...payloadBase,
            expectedUpdatedAt: form.expectedUpdatedAt,
          },
        });
        notifySuccess('Testimoni berhasil diperbarui.', {
          toastId: 'admin-testimonial-saved',
        });
      } else {
        await createMutation.mutateAsync(payloadBase);
        notifySuccess('Draf testimoni berhasil dibuat.', {
          toastId: 'admin-testimonial-saved',
        });
      }
      setEditorOpen(false);
    } catch (err) {
      const parsed = extractAdminMutationError(
        err,
        'Gagal menyimpan testimoni.',
      );
      setActionError(parsed.message);
      if (Object.keys(parsed.fields).length > 0) {
        setFieldErrors(parsed.fields);
      }
      notifyError(parsed.message, { toastId: 'admin-testimonial-error' });
    }
  }

  async function handlePublish(item: AdminTestimonialItem) {
    setActionError(null);
    try {
      await updateMutation.mutateAsync({
        testimonialId: item.id,
        payload: {
          displayName: item.displayName,
          quote: item.quote,
          rating: item.rating,
          sourceLabel: item.sourceLabel,
          sourceUrl: item.sourceUrl,
          consentAt: item.consentAt,
          consentReference: item.consentReference,
          sortOrder: item.sortOrder,
          status: 'published',
          expectedUpdatedAt: item.updatedAt,
        },
      });
      notifySuccess('Testimoni berizin berhasil dipublikasikan.', {
        toastId: 'admin-testimonial-published',
      });
    } catch (err) {
      const message = extractAdminMutationError(
        err,
        'Gagal mempublikasikan testimoni.',
      ).message;
      setActionError(message);
      notifyError(message, { toastId: 'admin-testimonial-error' });
    }
  }

  async function handleConfirmArchive() {
    if (!archiveTarget) return;
    setActionError(null);
    try {
      await archiveMutation.mutateAsync({
        testimonialId: archiveTarget.id,
        payload: { expectedUpdatedAt: archiveTarget.updatedAt },
      });
      setArchiveTarget(null);
      notifySuccess('Testimoni berhasil diarsipkan.', {
        toastId: 'admin-testimonial-archived',
      });
    } catch (err) {
      const message = extractAdminMutationError(
        err,
        'Gagal mengarsipkan testimoni.',
      ).message;
      setActionError(message);
      notifyError(message, { toastId: 'admin-testimonial-error' });
    }
  }

  return {
    items,
    publishedConsented,
    isFetching: query.isFetching,
    refetch: query.refetch,
    editorOpen,
    setEditorOpen,
    form,
    setForm,
    archiveTarget,
    setArchiveTarget,
    actionError,
    fieldErrors,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isArchiving: archiveMutation.isPending,
    openCreate,
    openEdit,
    handleSubmit,
    handlePublish,
    handleConfirmArchive,
  };
}
