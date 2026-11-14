'use client';

import { type FormEvent, useMemo, useState } from 'react';

import { extractAdminMutationError } from '@/lib/errors';
import type {
  AdminCatalogStatus,
  AdminConfigImage,
  AdminConfigVariant,
  AdminProductEditorAggregate,
  ProductEditorFormState,
  SaveProductConfigurationInput,
} from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';
import {
  buildInitialProductPreviewUrls,
  buildPublicPreviewProductDto,
  toProductEditorFormState,
  validateProductConfiguration,
} from '@/utils/admin-product-editor';

import {
  useAdminProductEditor,
  useSaveAdminProductConfiguration,
} from './use-admin-catalog';

interface UseAdminProductEditorManagerOptions {
  profile: AdminSessionProfile;
  productId: string;
  initialAggregate: AdminProductEditorAggregate;
}

function toConfigurationInput(
  state: ProductEditorFormState,
  targetStatus?: AdminCatalogStatus,
): SaveProductConfigurationInput {
  const parsedSort = Number.parseInt(state.sortOrder, 10);
  return {
    expectedUpdatedAt: state.expectedUpdatedAt,
    product: {
      name: state.name.trim(),
      productType: state.productType,
      status: targetStatus ?? state.status,
      shortDescription: state.shortDescription.trim() || null,
      description: state.description.trim() || null,
      ingredientsInfo: state.ingredientsInfo.trim() || null,
      storageInstructions: state.storageInstructions.trim() || null,
      isFeatured: state.isFeatured,
      isBestSeller: state.isBestSeller,
      isNew: state.isNew,
      needsOwnerReview: state.needsOwnerReview,
      sortOrder: Number.isFinite(parsedSort) ? parsedSort : 0,
    },
    categories: state.categories,
    variants: state.variants,
    images: state.images,
  };
}

/** Controller hook managing product editor state, validation, live preview, and atomic save. */
export function useAdminProductEditorManager({
  profile,
  productId,
  initialAggregate,
}: UseAdminProductEditorManagerOptions) {
  const editorQuery = useAdminProductEditor(
    profile,
    productId,
    initialAggregate,
  );
  const saveMutation = useSaveAdminProductConfiguration(productId);
  const aggregate = editorQuery.data ?? initialAggregate;

  const [formState, setFormState] = useState<ProductEditorFormState>(() =>
    toProductEditorFormState(initialAggregate),
  );
  const [previewUrlsByImageId, setPreviewUrlsByImageId] = useState<
    Record<string, string | null>
  >(() => buildInitialProductPreviewUrls(initialAggregate));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isConflictError, setIsConflictError] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const persistedVariantIds = useMemo(
    () => new Set(aggregate.variants.map((v) => v.id)),
    [aggregate.variants],
  );
  const persistedVariantSkusById = useMemo(
    () => new Map(aggregate.variants.map((v) => [v.id, v.sku])),
    [aggregate.variants],
  );
  const branchOfferCountByVariantId = useMemo(
    () => new Map(aggregate.variants.map((v) => [v.id, v.branchOfferCount])),
    [aggregate.variants],
  );

  const categoriesById = useMemo(
    () =>
      new Map(aggregate.referenceData.categories.map((cat) => [cat.id, cat])),
    [aggregate.referenceData.categories],
  );
  const dietaryTagsById = useMemo(
    () => new Map(aggregate.referenceData.dietaryTags.map((dt) => [dt.id, dt])),
    [aggregate.referenceData.dietaryTags],
  );
  const componentVariantsById = useMemo(
    () =>
      new Map(
        aggregate.referenceData.componentVariants.map((cv) => [cv.id, cv]),
      ),
    [aggregate.referenceData.componentVariants],
  );

  const livePreviewDto = useMemo(
    () =>
      buildPublicPreviewProductDto({
        productId,
        slug: aggregate.product.slug,
        createdAt: aggregate.product.createdAt,
        config: toConfigurationInput(formState),
        categoriesById,
        dietaryTagsById,
        previewImages: formState.images.map((img) => ({
          id: img.id,
          isPrimary: img.isPrimary,
          isApproved: img.isApproved,
          sortOrder: img.sortOrder,
          altText: img.altText,
          previewUrl: previewUrlsByImageId[img.id] ?? null,
        })),
      }),
    [
      productId,
      aggregate.product.slug,
      aggregate.product.createdAt,
      formState,
      categoriesById,
      dietaryTagsById,
      previewUrlsByImageId,
    ],
  );

  function toggleCategory(categoryId: string) {
    setFormState((prev) => {
      const exists = prev.categories.some((c) => c.categoryId === categoryId);
      if (exists) {
        const next = prev.categories.filter((c) => c.categoryId !== categoryId);
        if (next.length > 0 && !next.some((c) => c.isPrimary)) {
          next[0] = { ...next[0], isPrimary: true };
        }
        return { ...prev, categories: next };
      }
      return {
        ...prev,
        categories: [
          ...prev.categories,
          { categoryId, isPrimary: prev.categories.length === 0 },
        ],
      };
    });
  }

  function setPrimaryCategory(categoryId: string) {
    setFormState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => ({
        ...c,
        isPrimary: c.categoryId === categoryId,
      })),
    }));
  }

  function updateVariants(nextVariants: AdminConfigVariant[]) {
    setFormState((prev) => ({ ...prev, variants: nextVariants }));
  }

  function updateVariantAt(
    variantIdx: number,
    nextVariant: AdminConfigVariant,
  ) {
    setFormState((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === variantIdx ? nextVariant : v,
      ),
    }));
  }

  function updateImages(
    nextImages: AdminConfigImage[],
    nextPreviewUrls?: Record<string, string | null>,
  ) {
    setFormState((prev) => ({ ...prev, images: nextImages }));
    if (nextPreviewUrls) {
      setPreviewUrlsByImageId(nextPreviewUrls);
    }
  }

  async function submitConfiguration(targetStatus?: AdminCatalogStatus) {
    setSaveError(null);
    setSaveNotice(null);
    setIsConflictError(false);
    setFieldErrors({});

    const payload = toConfigurationInput(formState, targetStatus);
    const localErrors = validateProductConfiguration(payload, {
      productId,
      categoriesById,
      dietaryTagsById,
      componentVariantsById,
      existingVariantSkusById: persistedVariantSkusById,
      requireApprovedBucketWhenApproved: false,
    });

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      setSaveError(
        'Konfigurasi produk belum valid. Periksa rincian kesalahan per baris di bawah.',
      );
      return;
    }

    try {
      const response = await saveMutation.mutateAsync(payload);
      setFormState(toProductEditorFormState(response.data.editor));
      setPreviewUrlsByImageId(
        buildInitialProductPreviewUrls(response.data.editor),
      );
      setSaveNotice(
        targetStatus === 'published'
          ? 'Konfigurasi produk tersimpan atomik dan dipublikasikan ke katalog.'
          : 'Seluruh konfigurasi produk berhasil disimpan dalam satu transaksi.',
      );
    } catch (err) {
      const parsed = extractAdminMutationError(
        err,
        'Terjadi kesalahan saat menyimpan konfigurasi produk.',
      );
      setFieldErrors(parsed.fields);
      setSaveError(parsed.message);
      setIsConflictError(parsed.isConflict);
    }
  }

  async function handleReloadLatest() {
    setSaveError(null);
    setIsConflictError(false);
    setFieldErrors({});
    const fresh = await editorQuery.refetch();
    if (fresh.data) {
      setFormState(toProductEditorFormState(fresh.data));
      setPreviewUrlsByImageId(buildInitialProductPreviewUrls(fresh.data));
      setSaveNotice('Data produk terbaru berhasil dimuat ulang.');
    }
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitConfiguration();
  }

  const errorEntries = Object.entries(fieldErrors).flatMap(([field, msgs]) =>
    msgs.map((msg) => ({ field, msg })),
  );

  return {
    aggregate,
    formState,
    setFormState,
    previewUrlsByImageId,
    fieldErrors,
    saveError,
    errorEntries,
    isConflictError,
    saveNotice,
    isFetching: editorQuery.isFetching,
    isSaving: saveMutation.isPending,
    persistedVariantIds,
    branchOfferCountByVariantId,
    livePreviewDto,
    toggleCategory,
    setPrimaryCategory,
    updateVariants,
    updateVariantAt,
    updateImages,
    submitConfiguration,
    handleReloadLatest,
    handleFormSubmit,
  };
}
