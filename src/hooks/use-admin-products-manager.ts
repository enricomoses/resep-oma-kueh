'use client';

import { type FormEvent, useEffect, useState } from 'react';

import { ADMIN_CATALOG_LIMITS } from '@/constants/admin-catalog.constant';
import {
  useAdminCategories,
  useAdminProductDetail,
  useAdminProducts,
  useArchiveAdminProduct,
  useCreateAdminProduct,
  useUpdateAdminProduct,
} from '@/hooks/use-admin-catalog';
import { extractAdminMutationError } from '@/lib/errors';
import type {
  AdminCatalogStatus,
  AdminCategoryListResponse,
  AdminProductItem,
  AdminProductListResponse,
  AdminProductQuery,
  ProductDialogFormState,
} from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';
import {
  clampAdminPageAfterRemoval,
  createInitialProductDialogForm,
  productItemToDialogForm,
  slugifyCatalogName,
} from '@/utils/admin-catalog';
import {
  createAdminProductSchema,
  updateAdminProductSchema,
} from '@/validations/admin-catalog.schema';

interface UseAdminProductsManagerParams {
  profile: AdminSessionProfile;
  initialProducts: AdminProductListResponse;
  initialCategories: AdminCategoryListResponse;
}

/**
 * Coordinates product search, filtering, pagination, create/edit dialog, and archiving in Admin.
 */
export function useAdminProductsManager({
  profile,
  initialProducts,
  initialCategories,
}: UseAdminProductsManagerParams) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | AdminCatalogStatus>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(initialProducts.page);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      setDebouncedQ((prev) => {
        if (prev !== trimmed) {
          setPage(1);
        }
        return trimmed;
      });
    }, ADMIN_CATALOG_LIMITS.SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const query: AdminProductQuery = {
    q: debouncedQ || undefined,
    status: statusFilter || undefined,
    categoryId: categoryFilter || undefined,
    page,
    limit: initialProducts.limit,
  };

  const isDefaultQuery =
    !debouncedQ &&
    !statusFilter &&
    !categoryFilter &&
    page === initialProducts.page;

  const productsQuery = useAdminProducts(
    profile,
    query,
    isDefaultQuery ? initialProducts : undefined,
  );
  const categoriesQuery = useAdminCategories(profile, initialCategories);

  const createMutation = useCreateAdminProduct();
  const updateMutation = useUpdateAdminProduct();
  const archiveMutation = useArchiveAdminProduct();

  const [formOpen, setFormOpen] = useState(false);
  const [formState, setFormState] = useState<ProductDialogFormState>(
    createInitialProductDialogForm,
  );
  const productDetailQuery = useAdminProductDetail(
    profile,
    formOpen && formState.mode === 'edit' ? formState.id : null,
  );

  const [formError, setFormError] = useState<string | null>(null);
  const [conflictBanner, setConflictBanner] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [actionBanner, setActionBanner] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<AdminProductItem | null>(
    null,
  );
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const productPage = productsQuery.data ?? initialProducts;
  const categories = categoriesQuery.data?.items ?? initialCategories.items;

  function openCreateDialog() {
    setFormState(createInitialProductDialogForm());
    setFormError(null);
    setConflictBanner(null);
    setFieldErrors({});
    setFormOpen(true);
  }

  function openEditDialog(product: AdminProductItem) {
    setFormState(productItemToDialogForm(product));
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

  function applyZodIssues(
    issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
  ) {
    const nextErrors: Record<string, string[]> = {};
    for (const issue of issues) {
      const key = issue.path.join('.') || 'root';
      nextErrors[key] = [...(nextErrors[key] ?? []), issue.message];
    }
    setFieldErrors(nextErrors);
  }

  function applyMutationError(err: unknown) {
    const parsed = extractAdminMutationError(
      err,
      'Terjadi kesalahan saat menyimpan produk.',
    );
    if (parsed.isConflict) {
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

    if (formState.mode === 'create') {
      const candidate = {
        name: formState.name,
        slug: formState.slug,
        productType: formState.productType,
        shortDescription: formState.shortDescription || null,
        description: formState.description || null,
        ingredientsInfo: formState.ingredientsInfo || null,
        storageInstructions: formState.storageInstructions || null,
        isFeatured: formState.isFeatured,
        isBestSeller: formState.isBestSeller,
        isNew: formState.isNew,
        needsOwnerReview: formState.needsOwnerReview,
        sortOrder: Number.isNaN(parsedSortOrder) ? -1 : parsedSortOrder,
      };

      const parsed = createAdminProductSchema.safeParse(candidate);
      if (!parsed.success) {
        applyZodIssues(parsed.error.issues);
        setFormError('Periksa isian draf produk.');
        return;
      }

      try {
        await createMutation.mutateAsync(parsed.data);
        setFormOpen(false);
        setPage(1);
        setActionBanner({
          tone: 'success',
          message: `Produk draf "${parsed.data.name}" berhasil dibuat.`,
        });
      } catch (err) {
        applyMutationError(err);
      }
      return;
    }

    if (!formState.id || !formState.expectedUpdatedAt) return;

    const candidate = {
      name: formState.name,
      productType: formState.productType,
      status: formState.status,
      shortDescription: formState.shortDescription || null,
      description: formState.description || null,
      ingredientsInfo: formState.ingredientsInfo || null,
      storageInstructions: formState.storageInstructions || null,
      isFeatured: formState.isFeatured,
      isBestSeller: formState.isBestSeller,
      isNew: formState.isNew,
      needsOwnerReview: formState.needsOwnerReview,
      sortOrder: Number.isNaN(parsedSortOrder) ? -1 : parsedSortOrder,
      expectedUpdatedAt: formState.expectedUpdatedAt,
    };

    const parsed = updateAdminProductSchema.safeParse(candidate);
    if (!parsed.success) {
      applyZodIssues(parsed.error.issues);
      setFormError('Periksa perubahan produk.');
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
        message: `Produk "${parsed.data.name}" berhasil diperbarui.`,
      });
    } catch (err) {
      applyMutationError(err);
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

      const remainingAfter = productPage.items.filter(
        (item) => item.id !== archiveTarget.id,
      ).length;
      const totalAfter =
        statusFilter && statusFilter !== 'archived'
          ? Math.max(0, productPage.total - 1)
          : productPage.total;

      const nextPage = clampAdminPageAfterRemoval(
        page,
        remainingAfter,
        totalAfter,
        productPage.limit,
      );
      if (nextPage !== page) {
        setPage(nextPage);
      }

      setActionBanner({
        tone: 'success',
        message: `Produk "${archiveTarget.name}" telah diarsipkan.`,
      });
      setArchiveTarget(null);
    } catch (err) {
      setArchiveError(
        extractAdminMutationError(err, 'Gagal mengarsipkan produk.').message,
      );
    }
  }

  const listErrorMessage = productsQuery.isError
    ? extractAdminMutationError(
        productsQuery.error,
        'Gagal memuat daftar produk.',
      ).message
    : null;

  return {
    searchInput,
    setSearchInput,
    statusFilter,
    onStatusFilterChange: (next: '' | AdminCatalogStatus) => {
      setStatusFilter(next);
      setPage(1);
    },
    categoryFilter,
    onCategoryFilterChange: (next: string) => {
      setCategoryFilter(next);
      setPage(1);
    },
    productPage,
    categories,
    isFetching: productsQuery.isFetching,
    listErrorMessage,
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
    isArchiving: archiveMutation.isPending,
    openCreateDialog,
    openEditDialog,
    onRequestArchive: (target: AdminProductItem) => {
      setArchiveError(null);
      setArchiveTarget(target);
    },
    handleNameChange,
    handleFormSubmit: (event: FormEvent<HTMLFormElement>) =>
      void handleFormSubmit(event),
    handleConfirmArchive: () => void handleConfirmArchive(),
    handleRefresh: () => void productsQuery.refetch(),
    handleReloadLatest: async () => {
      const res = await productDetailQuery.refetch();
      if (res.data) {
        openEditDialog(res.data);
      }
    },
    onPrevPage: () => setPage((prev) => Math.max(1, prev - 1)),
    onNextPage: () =>
      setPage((prev) => Math.min(productPage.totalPages, prev + 1)),
  };
}
