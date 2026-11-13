'use client';

import {
  Archive,
  Pencil,
  Plus,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';

import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  ADMIN_CATALOG_COPY,
  ADMIN_CATALOG_LIMITS,
} from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import {
  useAdminCategories,
  useAdminProductDetail,
  useAdminProducts,
  useArchiveAdminProduct,
  useCreateAdminProduct,
  useUpdateAdminProduct,
} from '@/hooks/use-admin-catalog';
import { ApiClientError } from '@/lib/errors';
import type {
  AdminCatalogStatus,
  AdminCategoryListResponse,
  AdminProductItem,
  AdminProductListResponse,
  AdminProductQuery,
  AdminProductType,
} from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';
import { cn } from '@/utils';
import {
  buildAdminProductEditRoute,
  clampAdminPageAfterRemoval,
  slugifyCatalogName,
} from '@/utils/admin-catalog';
import {
  createAdminProductSchema,
  updateAdminProductSchema,
} from '@/validations/admin-catalog.schema';

interface AdminProductsViewProps {
  profile: AdminSessionProfile;
  initialProducts: AdminProductListResponse;
  initialCategories: AdminCategoryListResponse;
  className?: string;
}

interface ProductFormState {
  mode: 'create' | 'edit';
  id: string | null;
  name: string;
  slug: string;
  slugTouched: boolean;
  productType: AdminProductType;
  status: AdminCatalogStatus;
  shortDescription: string;
  description: string;
  ingredientsInfo: string;
  storageInstructions: string;
  sortOrder: string;
  needsOwnerReview: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  expectedUpdatedAt: string | null;
  readiness: AdminProductItem['readiness'] | null;
}

function createInitialProductForm(): ProductFormState {
  return {
    mode: 'create',
    id: null,
    name: '',
    slug: '',
    slugTouched: false,
    productType: 'simple',
    status: 'draft',
    shortDescription: '',
    description: '',
    ingredientsInfo: '',
    storageInstructions: '',
    sortOrder: '0',
    needsOwnerReview: true,
    isFeatured: false,
    isBestSeller: false,
    isNew: false,
    expectedUpdatedAt: null,
    readiness: null,
  };
}

function getStatusBadgeTone(status: AdminCatalogStatus) {
  if (status === 'published') return 'success';
  if (status === 'archived') return 'neutral';
  return 'accent';
}

export function AdminProductsView({
  profile,
  initialProducts,
  initialCategories,
  className,
}: AdminProductsViewProps) {
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
  const [formState, setFormState] = useState<ProductFormState>(
    createInitialProductForm,
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
    setFormState(createInitialProductForm());
    setFormError(null);
    setConflictBanner(null);
    setFieldErrors({});
    setFormOpen(true);
  }

  function openEditDialog(product: AdminProductItem) {
    setFormState({
      mode: 'edit',
      id: product.id,
      name: product.name,
      slug: product.slug,
      slugTouched: true,
      productType: product.productType,
      status: product.status,
      shortDescription: product.shortDescription ?? '',
      description: product.description ?? '',
      ingredientsInfo: product.ingredientsInfo ?? '',
      storageInstructions: product.storageInstructions ?? '',
      sortOrder: String(product.sortOrder),
      needsOwnerReview: product.needsOwnerReview,
      isFeatured: product.isFeatured,
      isBestSeller: product.isBestSeller,
      isNew: product.isNew,
      expectedUpdatedAt: product.updatedAt,
      readiness: product.readiness,
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
    if (err instanceof ApiClientError) {
      if (err.code === 'CONFLICT') {
        setConflictBanner(err.message);
      }
      setFormError(err.message);
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
      return;
    }
    setFormError('Terjadi kesalahan saat menyimpan produk.');
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
        err instanceof ApiClientError
          ? err.message
          : 'Gagal mengarsipkan produk.',
      );
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <section className={cn('admin-section', className)}>
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">
            {ADMIN_CATALOG_COPY.PRODUCTS.TITLE}
          </h2>
          <p className="admin-section-subtitle">
            {ADMIN_CATALOG_COPY.PRODUCTS.SUBTITLE}
          </p>
        </div>
        <div className="admin-inline-actions">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={productsQuery.isFetching}
            loadingLabel={ADMIN_CATALOG_COPY.PRODUCTS.REFRESH}
            onClick={() => {
              void productsQuery.refetch();
            }}
          >
            <RefreshCw size={16} aria-hidden="true" />
            <span>{ADMIN_CATALOG_COPY.PRODUCTS.REFRESH}</span>
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={openCreateDialog}
          >
            <Plus size={16} aria-hidden="true" />
            <span>{ADMIN_CATALOG_COPY.PRODUCTS.ADD_BUTTON}</span>
          </Button>
          <ActionLink
            href={ROUTES.ADMIN_PRODUCTS_NEW}
            variant="secondary"
            size="sm"
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            <span>{ADMIN_CATALOG_COPY.PRODUCT_EDITOR.NEW_PRODUCT_BTN}</span>
          </ActionLink>
        </div>
      </div>

      <Feedback tone="info" title="Ruang lingkup data inti produk (F16)">
        {ADMIN_CATALOG_COPY.PRODUCTS.NO_PRICE_NOTICE}
      </Feedback>

      {actionBanner ? (
        <Feedback
          tone={actionBanner.tone}
          title={actionBanner.message}
          announce
        />
      ) : null}

      {productsQuery.error instanceof ApiClientError ? (
        <Feedback tone="error" title={productsQuery.error.message} announce />
      ) : null}

      <Card tone="cream" className="admin-filter-bar">
        <div className="admin-filter-grid">
          <FormField label={ADMIN_CATALOG_COPY.PRODUCTS.SEARCH_LABEL}>
            {(props) => (
              <Input
                {...props}
                placeholder={ADMIN_CATALOG_COPY.PRODUCTS.SEARCH_PLACEHOLDER}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            )}
          </FormField>

          <FormField label={ADMIN_CATALOG_COPY.PRODUCTS.FILTER_STATUS_LABEL}>
            {(props) => (
              <Select
                {...props}
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value as '' | AdminCatalogStatus,
                  );
                  setPage(1);
                }}
              >
                <option value="">
                  {ADMIN_CATALOG_COPY.PRODUCTS.FILTER_STATUS_ALL}
                </option>
                <option value="draft">
                  {ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS.draft}
                </option>
                <option value="published">
                  {ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS.published}
                </option>
                <option value="archived">
                  {ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS.archived}
                </option>
              </Select>
            )}
          </FormField>

          <FormField label={ADMIN_CATALOG_COPY.PRODUCTS.FILTER_CATEGORY_LABEL}>
            {(props) => (
              <Select
                {...props}
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">
                  {ADMIN_CATALOG_COPY.PRODUCTS.FILTER_CATEGORY_ALL}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </div>
      </Card>

      {productPage.items.length === 0 ? (
        <Card tone="cream" className="admin-empty-card">
          <p className="admin-section-subtitle">
            {ADMIN_CATALOG_COPY.PRODUCTS.EMPTY}
          </p>
        </Card>
      ) : (
        <div className="admin-list-stack">
          {productPage.items.map((product) => (
            <Card key={product.id} tone="surface" className="admin-row-card">
              <div className="admin-row-main">
                <div className="admin-row-title-row">
                  <h3 className="admin-row-title admin-wrap-text">
                    {product.name}
                  </h3>
                  <Badge tone={getStatusBadgeTone(product.status)}>
                    {ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS[product.status]}
                  </Badge>
                  <Badge tone="neutral">
                    {
                      ADMIN_CATALOG_COPY.PRODUCTS.TYPE_LABELS[
                        product.productType
                      ]
                    }
                  </Badge>
                  {product.needsOwnerReview ? (
                    <Badge tone="accent">Perlu Review</Badge>
                  ) : null}
                </div>
                <p className="admin-row-meta admin-wrap-text">
                  Slug: <code>{product.slug}</code> · Urutan:{' '}
                  {product.sortOrder} · Varian aktif:{' '}
                  {product.readiness.activeVariantCount}
                </p>
                {product.categories.length > 0 ? (
                  <p className="admin-row-meta admin-wrap-text">
                    Kategori:{' '}
                    {product.categories.map((cat) => cat.name).join(', ')}
                  </p>
                ) : null}
                {product.shortDescription ? (
                  <p className="admin-row-desc admin-wrap-text">
                    {product.shortDescription}
                  </p>
                ) : null}
              </div>

              <div className="admin-row-actions">
                <ActionLink
                  href={buildAdminProductEditRoute(product.id)}
                  variant="primary"
                  size="sm"
                >
                  <SlidersHorizontal size={15} aria-hidden="true" />
                  <span>
                    {ADMIN_CATALOG_COPY.PRODUCT_EDITOR.OPEN_EDITOR_BTN}
                  </span>
                </ActionLink>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => openEditDialog(product)}
                >
                  <Pencil size={15} aria-hidden="true" />
                  <span>{ADMIN_CATALOG_COPY.PRODUCTS.EDIT_BTN}</span>
                </Button>
                {product.status !== 'archived' ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setArchiveError(null);
                      setArchiveTarget(product);
                    }}
                  >
                    <Archive size={15} aria-hidden="true" />
                    <span>{ADMIN_CATALOG_COPY.PRODUCTS.ARCHIVE_BTN}</span>
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="admin-pagination">
        <p className="admin-row-meta">
          Halaman {productPage.page} dari {productPage.totalPages} · Total{' '}
          {productPage.total} produk
        </p>
        <div className="admin-inline-actions">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={productPage.page <= 1 || productsQuery.isFetching}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            {ADMIN_CATALOG_COPY.PRODUCTS.PAGINATION_PREV}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={
              productPage.page >= productPage.totalPages ||
              productsQuery.isFetching
            }
            onClick={() =>
              setPage((prev) => Math.min(productPage.totalPages, prev + 1))
            }
          >
            {ADMIN_CATALOG_COPY.PRODUCTS.PAGINATION_NEXT}
          </Button>
        </div>
      </div>

      <Dialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={
          formState.mode === 'create'
            ? ADMIN_CATALOG_COPY.PRODUCTS.FORM_CREATE_TITLE
            : ADMIN_CATALOG_COPY.PRODUCTS.FORM_EDIT_TITLE
        }
      >
        <form onSubmit={handleFormSubmit} className="admin-modal-form">
          {conflictBanner ? (
            <Feedback tone="error" title={conflictBanner} announce>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={async () => {
                  const res = await productDetailQuery.refetch();
                  if (res.data) {
                    openEditDialog(res.data);
                  }
                }}
              >
                Muat ulang data terbaru
              </Button>
            </Feedback>
          ) : formError ? (
            <Feedback tone="error" title={formError} announce />
          ) : null}

          {formState.mode === 'edit' && formState.readiness ? (
            <Feedback
              tone="info"
              title={ADMIN_CATALOG_COPY.PRODUCTS.PUBLISH_READY_LABEL}
            >
              {formState.readiness.isPublishReady ? (
                ADMIN_CATALOG_COPY.PRODUCTS.PUBLISH_READY_OK
              ) : (
                <ul className="admin-readiness-list">
                  {formState.readiness.missingReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              )}
            </Feedback>
          ) : null}

          <FormField
            label={ADMIN_CATALOG_COPY.PRODUCTS.NAME_LABEL}
            required
            error={fieldErrors.name?.[0]}
          >
            {(props) => (
              <Input
                {...props}
                value={formState.name}
                onChange={(event) => handleNameChange(event.target.value)}
              />
            )}
          </FormField>

          <FormField
            label={ADMIN_CATALOG_COPY.PRODUCTS.SLUG_LABEL}
            required={formState.mode === 'create'}
            helper={
              formState.mode === 'create'
                ? ADMIN_CATALOG_COPY.PRODUCTS.SLUG_HELP_CREATE
                : ADMIN_CATALOG_COPY.PRODUCTS.SLUG_HELP_LOCKED
            }
            error={fieldErrors.slug?.[0]}
          >
            {(props) => (
              <Input
                {...props}
                value={formState.slug}
                readOnly={formState.mode === 'edit'}
                disabled={formState.mode === 'edit'}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    slug: event.target.value,
                    slugTouched: true,
                  }))
                }
              />
            )}
          </FormField>

          <div className="admin-form-row-2">
            <FormField
              label={ADMIN_CATALOG_COPY.PRODUCTS.TYPE_LABEL}
              required
              error={fieldErrors.productType?.[0]}
            >
              {(props) => (
                <Select
                  {...props}
                  value={formState.productType}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      productType: event.target.value as AdminProductType,
                    }))
                  }
                >
                  <option value="simple">
                    {ADMIN_CATALOG_COPY.PRODUCTS.TYPE_LABELS.simple}
                  </option>
                  <option value="variants">
                    {ADMIN_CATALOG_COPY.PRODUCTS.TYPE_LABELS.variants}
                  </option>
                  <option value="bundle">
                    {ADMIN_CATALOG_COPY.PRODUCTS.TYPE_LABELS.bundle}
                  </option>
                </Select>
              )}
            </FormField>

            <FormField
              label={ADMIN_CATALOG_COPY.PRODUCTS.SORT_LABEL}
              required
              error={fieldErrors.sortOrder?.[0]}
            >
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min={0}
                  max={9999}
                  value={formState.sortOrder}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      sortOrder: event.target.value,
                    }))
                  }
                />
              )}
            </FormField>
          </div>

          {formState.mode === 'edit' ? (
            <FormField
              label={ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABEL}
              required
              error={fieldErrors.status?.[0]}
            >
              {(props) => (
                <Select
                  {...props}
                  value={formState.status}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      status: event.target.value as AdminCatalogStatus,
                    }))
                  }
                >
                  <option value="draft">
                    {ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS.draft}
                  </option>
                  <option value="published">
                    {ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS.published}
                  </option>
                  <option value="archived">
                    {ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS.archived}
                  </option>
                </Select>
              )}
            </FormField>
          ) : null}

          <FormField
            label={ADMIN_CATALOG_COPY.PRODUCTS.SHORT_DESC_LABEL}
            error={fieldErrors.shortDescription?.[0]}
          >
            {(props) => (
              <Input
                {...props}
                value={formState.shortDescription}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    shortDescription: event.target.value,
                  }))
                }
              />
            )}
          </FormField>

          <FormField
            label={ADMIN_CATALOG_COPY.PRODUCTS.DESC_LABEL}
            error={fieldErrors.description?.[0]}
          >
            {(props) => (
              <Textarea
                {...props}
                rows={3}
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            )}
          </FormField>

          <FormField
            label={ADMIN_CATALOG_COPY.PRODUCTS.INGREDIENTS_LABEL}
            error={fieldErrors.ingredientsInfo?.[0]}
          >
            {(props) => (
              <Textarea
                {...props}
                rows={2}
                value={formState.ingredientsInfo}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    ingredientsInfo: event.target.value,
                  }))
                }
              />
            )}
          </FormField>

          <FormField
            label={ADMIN_CATALOG_COPY.PRODUCTS.STORAGE_LABEL}
            error={fieldErrors.storageInstructions?.[0]}
          >
            {(props) => (
              <Textarea
                {...props}
                rows={2}
                value={formState.storageInstructions}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    storageInstructions: event.target.value,
                  }))
                }
              />
            )}
          </FormField>

          <div className="admin-checkbox-group">
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={formState.needsOwnerReview}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    needsOwnerReview: event.target.checked,
                  }))
                }
              />
              <span>{ADMIN_CATALOG_COPY.PRODUCTS.REVIEW_CHECKBOX}</span>
            </label>

            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={formState.isFeatured}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    isFeatured: event.target.checked,
                  }))
                }
              />
              <span>{ADMIN_CATALOG_COPY.PRODUCTS.FEATURED_CHECKBOX}</span>
            </label>

            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={formState.isBestSeller}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    isBestSeller: event.target.checked,
                  }))
                }
              />
              <span>{ADMIN_CATALOG_COPY.PRODUCTS.BEST_SELLER_CHECKBOX}</span>
            </label>

            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={formState.isNew}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    isNew: event.target.checked,
                  }))
                }
              />
              <span>{ADMIN_CATALOG_COPY.PRODUCTS.NEW_CHECKBOX}</span>
            </label>
          </div>

          <div className="admin-modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFormOpen(false)}
            >
              {ADMIN_CATALOG_COPY.PRODUCTS.CANCEL}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSaving}
              loadingLabel="Menyimpan..."
            >
              {formState.mode === 'create'
                ? ADMIN_CATALOG_COPY.PRODUCTS.SAVE_CREATE
                : ADMIN_CATALOG_COPY.PRODUCTS.SAVE_EDIT}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
        title={ADMIN_CATALOG_COPY.PRODUCTS.ARCHIVE_CONFIRM_TITLE}
        description={ADMIN_CATALOG_COPY.PRODUCTS.ARCHIVE_CONFIRM_DESC}
      >
        <div className="admin-modal-form">
          {archiveTarget ? (
            <p className="admin-row-title admin-wrap-text">
              {archiveTarget.name} (<code>{archiveTarget.slug}</code>)
            </p>
          ) : null}
          {archiveError ? (
            <Feedback tone="error" title={archiveError} announce />
          ) : null}
          <div className="admin-modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setArchiveTarget(null)}
            >
              {ADMIN_CATALOG_COPY.PRODUCTS.CANCEL}
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={archiveMutation.isPending}
              loadingLabel="Mengarsipkan..."
              onClick={() => {
                void handleConfirmArchive();
              }}
            >
              {ADMIN_CATALOG_COPY.PRODUCTS.ARCHIVE_CONFIRM_SUBMIT}
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
