'use client';

import { useMemo, useState } from 'react';

import { extractAdminMutationError } from '@/lib/errors';
import { notifyError, notifySuccess } from '@/lib/toast';
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

import {
  useAdminPromotions,
  useArchiveAdminPromotion,
  useCreateAdminPromotion,
  useSaveAdminShippingBanner,
  useUpdateAdminPromotion,
  useUploadAdminProductMedia,
} from '@/hooks/queries/use-admin-catalog';

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
      notifySuccess('Banner promosi berhasil diunggah ke draf.', {
        toastId: 'admin-promo-upload',
      });
    } catch (err) {
      const message = extractAdminMutationError(
        err,
        'Gagal mengunggah banner promosi.',
      ).message;
      setUploadError(message);
      notifyError(message, { toastId: 'admin-promo-upload-error' });
    } finally {
      setIsUploadingBanner(false);
    }
  }

  async function handleSavePromotion() {
    setFormError(null);
    setFieldErrors({});

    const startsAt = fromJakartaDateTimeInputValue(formState.startsAtLocal);
    const endsAt = fromJakartaDateTimeInputValue(formState.endsAtLocal);
    if (!startsAt || !endsAt) {
      const message = 'Format tanggal/jam WIB tidak valid.';
      setFormError(message);
      notifyError(message, { toastId: 'admin-promo-error' });
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
      const message =
        'Periksa kembali angka diskon, minimum belanja, dan prioritas.';
      setFormError(message);
      notifyError(message, { toastId: 'admin-promo-error' });
      return;
    }
    if (maxDiscountIdr !== null && !Number.isFinite(maxDiscountIdr)) {
      const message = 'Batas diskon per baris harus berupa bilangan bulat.';
      setFormError(message);
      notifyError(message, { toastId: 'admin-promo-error' });
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

      notifySuccess(
        `Promosi "${response.data.promotion.title}" berhasil disimpan.`,
        { toastId: 'admin-promo-saved' },
      );
      setFormOpen(false);
    } catch (err) {
      const parsed = extractAdminMutationError(err, 'Gagal menyimpan promosi.');
      setFormError(parsed.message);
      if (Object.keys(parsed.fields).length > 0) {
        setFieldErrors(parsed.fields);
      }
      notifyError(parsed.message, { toastId: 'admin-promo-error' });
    }
  }

  async function handleConfirmArchive() {
    if (!archiveTarget) return;
    setFormError(null);
    try {
      const response = await archiveMutation.mutateAsync({
        id: archiveTarget.id,
        expectedUpdatedAt: archiveTarget.updatedAt,
      });
      notifySuccess(
        `Promosi "${response.data.promotion.title}" berhasil diarsipkan dan dinonaktifkan.`,
        { toastId: 'admin-promo-archived' },
      );
      setArchiveTarget(null);
    } catch (err) {
      const message = extractAdminMutationError(
        err,
        'Gagal mengarsipkan promosi.',
      ).message;
      setFormError(message);
      notifyError(message, { toastId: 'admin-promo-error' });
      setArchiveTarget(null);
    }
  }

  async function handleSaveShippingBanner() {
    setBannerError(null);
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
      notifySuccess('Banner info pengiriman berhasil disimpan.', {
        toastId: 'admin-shipping-banner-saved',
      });
    } catch (err) {
      const message = extractAdminMutationError(
        err,
        'Gagal menyimpan banner info pengiriman.',
      ).message;
      setBannerError(message);
      notifyError(message, { toastId: 'admin-shipping-banner-error' });
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
    archiveTarget,
    setArchiveTarget,
    bannerForm,
    setBannerForm,
    bannerError,
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
