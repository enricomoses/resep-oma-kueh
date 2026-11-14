'use client';

import { useMemo, useState } from 'react';

import type { AdminSessionProfile } from '@/types/auth';
import type {
  AdminPromotionItem,
  AdminPromotionsListResponse,
  PromotionFormState,
  SaveAdminPromotionInput,
  ShippingBannerFormState,
} from '@/types/promotion';
import {
  buildPromotionPreviewExamples,
  createEmptyPromotionForm,
  fromJakartaDateTimeInputValue,
  mapPromotionItemToForm,
} from '@/utils/admin-promotions';

import { extractAdminMutationError } from './admin-mutation-error';
import {
  useAdminPromotions,
  useArchiveAdminPromotion,
  useCreateAdminPromotion,
  useSaveAdminShippingBanner,
  useUpdateAdminPromotion,
  useUploadAdminProductMedia,
} from './use-admin-catalog';

interface UseAdminPromotionsManagerOptions {
  profile: AdminSessionProfile;
  initialData?: AdminPromotionsListResponse;
}

/** Controller hook managing promotions CRUD, banner upload, preview examples, and shipping banner state. */
export function useAdminPromotionsManager({
  profile,
  initialData,
}: UseAdminPromotionsManagerOptions) {
  const { data, isFetching, isError, refetch } = useAdminPromotions(
    profile,
    initialData,
  );
  const createMutation = useCreateAdminPromotion();
  const updateMutation = useUpdateAdminPromotion();
  const archiveMutation = useArchiveAdminPromotion();
  const shippingBannerMutation = useSaveAdminShippingBanner();
  const uploadBannerMutation = useUploadAdminProductMedia();

  const [formOpen, setFormOpen] = useState(false);
  const [formState, setFormState] = useState<PromotionFormState>(() =>
    createEmptyPromotionForm(),
  );
  const [slugTouched, setSlugTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<AdminPromotionItem | null>(
    null,
  );

  const [bannerForm, setBannerForm] = useState<ShippingBannerFormState>(() => ({
    title: data?.shippingBanner.title ?? '',
    body: data?.shippingBanner.body ?? '',
    status: data?.shippingBanner.status ?? 'draft',
    expectedUpdatedAt: data?.shippingBanner.updatedAt ?? null,
    syncedUpdatedAt: data?.shippingBanner.updatedAt ?? null,
  }));
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  if (
    data?.shippingBanner &&
    data.shippingBanner.updatedAt !== bannerForm.syncedUpdatedAt
  ) {
    setBannerForm({
      title: data.shippingBanner.title,
      body: data.shippingBanner.body,
      status: data.shippingBanner.status,
      expectedUpdatedAt: data.shippingBanner.updatedAt,
      syncedUpdatedAt: data.shippingBanner.updatedAt,
    });
  }

  const previewExamples = useMemo(() => {
    const discountValue = Number(formState.discountValue);
    const minSpendIdr = Number.parseInt(formState.minSpendIdr || '0', 10);
    const maxDiscountIdr =
      formState.maxDiscountIdr.trim() === ''
        ? null
        : Number.parseInt(formState.maxDiscountIdr, 10);
    const priority = Number.parseInt(formState.priority || '0', 10);

    return buildPromotionPreviewExamples({
      id: formState.id ?? undefined,
      title: formState.title || 'Pratinjau Promo',
      discountType: formState.discountType,
      discountValue: Number.isFinite(discountValue) ? discountValue : 0,
      minSpendIdr: Number.isFinite(minSpendIdr) ? minSpendIdr : 0,
      maxDiscountIdr:
        maxDiscountIdr !== null && Number.isFinite(maxDiscountIdr)
          ? maxDiscountIdr
          : null,
      priority: Number.isFinite(priority) ? priority : 0,
    });
  }, [
    formState.discountType,
    formState.discountValue,
    formState.id,
    formState.maxDiscountIdr,
    formState.minSpendIdr,
    formState.priority,
    formState.title,
  ]);

  const promotions = data?.promotions ?? [];
  const references = data?.references ?? {
    branches: [],
    categories: [],
    products: [],
    variants: [],
  };

  function openCreateForm() {
    setFormState(createEmptyPromotionForm());
    setSlugTouched(false);
    setFormError(null);
    setFieldErrors({});
    setUploadError(null);
    setFormOpen(true);
  }

  function openEditForm(item: AdminPromotionItem) {
    setFormState(mapPromotionItemToForm(item));
    setSlugTouched(true);
    setFormError(null);
    setFieldErrors({});
    setUploadError(null);
    setFormOpen(true);
  }

  async function handleBannerFileChange(file: File | null) {
    if (!file) return;
    setUploadError(null);
    setIsUploadingBanner(true);
    try {
      const response = await uploadBannerMutation.mutateAsync(file);
      setFormState((prev) => ({
        ...prev,
        bannerDraftPath: response.data.storagePath,
        bannerPreviewUrl: response.data.previewUrl,
      }));
    } catch (err) {
      setUploadError(
        extractAdminMutationError(err, 'Gagal mengunggah banner promosi.')
          .message,
      );
    } finally {
      setIsUploadingBanner(false);
    }
  }

  async function handleSavePromotion() {
    setFormError(null);
    setFieldErrors({});
    setFeedbackMsg(null);

    const startsAt = fromJakartaDateTimeInputValue(formState.startsAtLocal);
    const endsAt = fromJakartaDateTimeInputValue(formState.endsAtLocal);
    if (!startsAt || !endsAt) {
      setFormError('Format tanggal/jam WIB tidak valid.');
      return;
    }

    const discountValue = Number(formState.discountValue);
    const minSpendIdr = Number.parseInt(formState.minSpendIdr || '0', 10);
    const maxDiscountIdr =
      formState.maxDiscountIdr.trim() === ''
        ? null
        : Number.parseInt(formState.maxDiscountIdr, 10);
    const priority = Number.parseInt(formState.priority || '0', 10);

    if (
      !Number.isFinite(discountValue) ||
      !Number.isFinite(minSpendIdr) ||
      !Number.isFinite(priority)
    ) {
      setFormError(
        'Periksa kembali angka diskon, minimum belanja, dan prioritas.',
      );
      return;
    }
    if (maxDiscountIdr !== null && !Number.isFinite(maxDiscountIdr)) {
      setFormError('Batas diskon per baris harus berupa bilangan bulat.');
      return;
    }

    const payload: SaveAdminPromotionInput = {
      expectedUpdatedAt: formState.id ? formState.expectedUpdatedAt : null,
      title: formState.title,
      slug: formState.slug,
      description:
        formState.description.trim() === '' ? null : formState.description,
      discountType: formState.discountType,
      discountValue,
      maxDiscountIdr,
      minSpendIdr,
      scope: formState.scope,
      startsAt,
      endsAt,
      priority,
      status: formState.status,
      isEnabled: formState.isEnabled,
      isStackable: false,
      bannerImagePath: formState.bannerImagePath,
      ...(formState.bannerDraftPath
        ? { bannerDraftPath: formState.bannerDraftPath }
        : {}),
      branchIds: formState.branchIds,
      categoryIds: formState.scope === 'category' ? formState.categoryIds : [],
      productIds: formState.scope === 'product' ? formState.productIds : [],
      variantIds: formState.scope === 'variant' ? formState.variantIds : [],
    };

    try {
      const response = formState.id
        ? await updateMutation.mutateAsync({ id: formState.id, payload })
        : await createMutation.mutateAsync(payload);

      setFeedbackMsg(
        `Promosi "${response.data.promotion.title}" berhasil disimpan.`,
      );
      setFormOpen(false);
    } catch (err) {
      const parsed = extractAdminMutationError(err, 'Gagal menyimpan promosi.');
      setFormError(parsed.message);
      if (Object.keys(parsed.fields).length > 0) {
        setFieldErrors(parsed.fields);
      }
    }
  }

  async function handleConfirmArchive() {
    if (!archiveTarget) return;
    setFormError(null);
    setFeedbackMsg(null);
    try {
      const response = await archiveMutation.mutateAsync({
        id: archiveTarget.id,
        expectedUpdatedAt: archiveTarget.updatedAt,
      });
      setFeedbackMsg(
        `Promosi "${response.data.promotion.title}" berhasil diarsipkan dan dinonaktifkan.`,
      );
      setArchiveTarget(null);
    } catch (err) {
      setFormError(
        extractAdminMutationError(err, 'Gagal mengarsipkan promosi.').message,
      );
      setArchiveTarget(null);
    }
  }

  async function handleSaveShippingBanner() {
    setBannerError(null);
    setBannerSuccess(null);
    try {
      const response = await shippingBannerMutation.mutateAsync({
        expectedUpdatedAt: bannerForm.expectedUpdatedAt,
        title: bannerForm.title,
        body: bannerForm.body,
        status: bannerForm.status,
      });
      setBannerForm({
        title: response.data.shippingBanner.title,
        body: response.data.shippingBanner.body,
        status: response.data.shippingBanner.status,
        expectedUpdatedAt: response.data.shippingBanner.updatedAt,
        syncedUpdatedAt: response.data.shippingBanner.updatedAt,
      });
      setBannerSuccess('Banner info pengiriman berhasil disimpan.');
    } catch (err) {
      setBannerError(
        extractAdminMutationError(
          err,
          'Gagal menyimpan banner info pengiriman.',
        ).message,
      );
    }
  }

  return {
    promotions,
    references,
    previewExamples,
    isFetching,
    isError,
    refetch,
    formOpen,
    setFormOpen,
    formState,
    setFormState,
    slugTouched,
    setSlugTouched,
    formError,
    fieldErrors,
    uploadError,
    isUploadingBanner,
    feedbackMsg,
    archiveTarget,
    setArchiveTarget,
    bannerForm,
    setBannerForm,
    bannerError,
    bannerSuccess,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isArchiving: archiveMutation.isPending,
    isSavingBanner: shippingBannerMutation.isPending,
    openCreateForm,
    openEditForm,
    handleBannerFileChange,
    handleSavePromotion,
    handleConfirmArchive,
    handleSaveShippingBanner,
  };
}
