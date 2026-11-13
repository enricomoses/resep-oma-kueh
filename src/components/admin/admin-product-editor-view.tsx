'use client';

import { ArrowLeft, CheckCircle2, RefreshCw, Save } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';

import { MenuProductCard } from '@/components/catalog/menu-product-card';
import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import {
  useAdminProductEditor,
  useSaveAdminProductConfiguration,
} from '@/hooks/use-admin-catalog';
import { ApiClientError } from '@/lib/errors';
import type {
  AdminCatalogStatus,
  AdminConfigCategory,
  AdminConfigImage,
  AdminConfigVariant,
  AdminProductEditorAggregate,
  AdminProductType,
  SaveProductConfigurationInput,
} from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';
import { cn } from '@/utils';
import {
  buildPublicPreviewProductDto,
  validateProductConfiguration,
} from '@/utils/admin-product-editor';

import { AdminProductBundleSection } from './admin-product-bundle-section';
import { AdminProductDietarySection } from './admin-product-dietary-section';
import { AdminProductImagesSection } from './admin-product-images-section';
import { AdminProductVariantsSection } from './admin-product-variants-section';

interface AdminProductEditorViewProps {
  profile: AdminSessionProfile;
  productId: string;
  initialAggregate: AdminProductEditorAggregate;
  className?: string;
}

interface EditorFormState {
  expectedUpdatedAt: string;
  name: string;
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
  categories: AdminConfigCategory[];
  variants: AdminConfigVariant[];
  images: AdminConfigImage[];
}

function toEditorFormState(
  aggregate: AdminProductEditorAggregate,
): EditorFormState {
  return {
    expectedUpdatedAt: aggregate.product.updatedAt,
    name: aggregate.product.name,
    productType: aggregate.product.productType,
    status: aggregate.product.status,
    shortDescription: aggregate.product.shortDescription ?? '',
    description: aggregate.product.description ?? '',
    ingredientsInfo: aggregate.product.ingredientsInfo ?? '',
    storageInstructions: aggregate.product.storageInstructions ?? '',
    sortOrder: String(aggregate.product.sortOrder),
    needsOwnerReview: aggregate.product.needsOwnerReview,
    isFeatured: aggregate.product.isFeatured,
    isBestSeller: aggregate.product.isBestSeller,
    isNew: aggregate.product.isNew,
    categories: aggregate.categories,
    variants: aggregate.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      sizeLabel: v.sizeLabel,
      basePriceIdr: v.basePriceIdr,
      status: v.status,
      sortOrder: v.sortOrder,
      maxQuantityPerOrder: v.maxQuantityPerOrder,
      isDefault: v.isDefault,
      bundleRecipe: v.bundleRecipe,
      bundleUnitsTotal: v.bundleUnitsTotal,
      bundleRulesVerified: v.bundleRulesVerified,
      fixedComponents: v.fixedComponents,
      optionGroups: v.optionGroups,
      dietaryTags: v.dietaryTags,
      allergens: v.allergens,
    })),
    images: aggregate.images.map((img) => ({
      id: img.id,
      variantId: img.variantId,
      storageBucket: img.storageBucket,
      storagePath: img.storagePath,
      altText: img.altText,
      isApproved: img.isApproved,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    })),
  };
}

function buildInitialPreviewUrls(
  aggregate: AdminProductEditorAggregate,
): Record<string, string | null> {
  const map: Record<string, string | null> = {};
  for (const img of aggregate.images) {
    map[img.id] = img.previewUrl;
  }
  return map;
}

export function AdminProductEditorView({
  profile,
  productId,
  initialAggregate,
  className,
}: AdminProductEditorViewProps) {
  const editorQuery = useAdminProductEditor(
    profile,
    productId,
    initialAggregate,
  );
  const saveMutation = useSaveAdminProductConfiguration(productId);
  const aggregate = editorQuery.data ?? initialAggregate;

  const [formState, setFormState] = useState<EditorFormState>(() =>
    toEditorFormState(initialAggregate),
  );
  const [previewUrlsByImageId, setPreviewUrlsByImageId] = useState<
    Record<string, string | null>
  >(() => buildInitialPreviewUrls(initialAggregate));
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

  function toConfigurationInput(
    targetStatus?: AdminCatalogStatus,
  ): SaveProductConfigurationInput {
    const parsedSort = Number.parseInt(formState.sortOrder, 10);
    return {
      expectedUpdatedAt: formState.expectedUpdatedAt,
      product: {
        name: formState.name.trim(),
        productType: formState.productType,
        status: targetStatus ?? formState.status,
        shortDescription: formState.shortDescription.trim() || null,
        description: formState.description.trim() || null,
        ingredientsInfo: formState.ingredientsInfo.trim() || null,
        storageInstructions: formState.storageInstructions.trim() || null,
        isFeatured: formState.isFeatured,
        isBestSeller: formState.isBestSeller,
        isNew: formState.isNew,
        needsOwnerReview: formState.needsOwnerReview,
        sortOrder: Number.isFinite(parsedSort) ? parsedSort : 0,
      },
      categories: formState.categories,
      variants: formState.variants,
      images: formState.images,
    };
  }

  const livePreviewDto = useMemo(() => {
    const parsedSort = Number.parseInt(formState.sortOrder, 10);
    const config: SaveProductConfigurationInput = {
      expectedUpdatedAt: formState.expectedUpdatedAt,
      product: {
        name: formState.name.trim(),
        productType: formState.productType,
        status: formState.status,
        shortDescription: formState.shortDescription.trim() || null,
        description: formState.description.trim() || null,
        ingredientsInfo: formState.ingredientsInfo.trim() || null,
        storageInstructions: formState.storageInstructions.trim() || null,
        isFeatured: formState.isFeatured,
        isBestSeller: formState.isBestSeller,
        isNew: formState.isNew,
        needsOwnerReview: formState.needsOwnerReview,
        sortOrder: Number.isFinite(parsedSort) ? parsedSort : 0,
      },
      categories: formState.categories,
      variants: formState.variants,
      images: formState.images,
    };

    return buildPublicPreviewProductDto({
      productId,
      slug: aggregate.product.slug,
      createdAt: aggregate.product.createdAt,
      config,
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
    });
  }, [
    productId,
    aggregate.product.slug,
    aggregate.product.createdAt,
    formState,
    categoriesById,
    dietaryTagsById,
    previewUrlsByImageId,
  ]);

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

  async function submitConfiguration(targetStatus?: AdminCatalogStatus) {
    setSaveError(null);
    setSaveNotice(null);
    setIsConflictError(false);
    setFieldErrors({});

    const payload = toConfigurationInput(targetStatus);
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
      setFormState(toEditorFormState(response.data.editor));
      setPreviewUrlsByImageId(buildInitialPreviewUrls(response.data.editor));
      setSaveNotice(
        targetStatus === 'published'
          ? 'Konfigurasi produk tersimpan atomik dan dipublikasikan ke katalog.'
          : 'Seluruh konfigurasi produk berhasil disimpan dalam satu transaksi.',
      );
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFieldErrors(err.fieldErrors ?? {});
        setSaveError(err.message);
        setIsConflictError(err.status === 409);
      } else {
        setSaveError('Terjadi kesalahan saat menyimpan konfigurasi produk.');
      }
    }
  }

  async function handleReloadLatest() {
    setSaveError(null);
    setIsConflictError(false);
    setFieldErrors({});
    const fresh = await editorQuery.refetch();
    if (fresh.data) {
      setFormState(toEditorFormState(fresh.data));
      setPreviewUrlsByImageId(buildInitialPreviewUrls(fresh.data));
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

  return (
    <section className={cn('admin-section', className)}>
      <div className="admin-section-header">
        <div>
          <ActionLink href={ROUTES.ADMIN_PRODUCTS} variant="ghost" size="sm">
            <ArrowLeft size={15} aria-hidden="true" />
            <span>{ADMIN_CATALOG_COPY.PRODUCT_EDITOR.BACK_TO_PRODUCTS}</span>
          </ActionLink>
          <div className="admin-inline-actions">
            <h2 className="admin-section-title">
              {ADMIN_CATALOG_COPY.PRODUCT_EDITOR.EDIT_PAGE_TITLE}:{' '}
              {aggregate.product.name}
            </h2>
            <Badge
              tone={
                formState.status === 'published'
                  ? 'success'
                  : formState.status === 'archived'
                    ? 'neutral'
                    : 'accent'
              }
            >
              {ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS[formState.status]}
            </Badge>
          </div>
          <p className="admin-row-meta">
            Slug permanen: <code>{aggregate.product.slug}</code> · Terakhir
            diperbarui: <code>{formState.expectedUpdatedAt}</code>
          </p>
        </div>

        <div className="admin-inline-actions">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={editorQuery.isFetching}
            loadingLabel="Memuat..."
            onClick={() => void handleReloadLatest()}
          >
            <RefreshCw size={15} aria-hidden="true" />
            <span>
              {ADMIN_CATALOG_COPY.PRODUCT_EDITOR.CONCURRENCY_CONFLICT_ACTION}
            </span>
          </Button>
        </div>
      </div>

      {saveNotice ? (
        <Feedback tone="success" title={saveNotice} announce />
      ) : null}

      {saveError ? (
        <Feedback tone="error" title={saveError} announce>
          {isConflictError ? (
            <div className="admin-inline-actions">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void handleReloadLatest()}
              >
                {ADMIN_CATALOG_COPY.PRODUCT_EDITOR.CONCURRENCY_CONFLICT_ACTION}
              </Button>
            </div>
          ) : null}
          {errorEntries.length > 0 ? (
            <ul className="admin-readiness-list">
              {errorEntries.map((entry, idx) => (
                <li key={`${entry.field}-${idx}`}>
                  <code>{entry.field}</code>: {entry.msg}
                </li>
              ))}
            </ul>
          ) : null}
        </Feedback>
      ) : null}

      <div className="admin-editor-layout">
        <form
          onSubmit={handleFormSubmit}
          className="admin-editor-main"
          noValidate
        >
          <Card className="admin-editor-item-card">
            <h3 className="admin-editor-heading">Informasi Inti Produk</h3>

            <div className="admin-form-row-2">
              <FormField
                label={ADMIN_CATALOG_COPY.PRODUCTS.NAME_LABEL}
                required
                error={fieldErrors['product.name']?.[0]}
              >
                {(props) => (
                  <Input
                    {...props}
                    value={formState.name}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                )}
              </FormField>

              <FormField label={ADMIN_CATALOG_COPY.PRODUCTS.SLUG_LABEL}>
                {(props) => (
                  <Input
                    {...props}
                    value={aggregate.product.slug}
                    readOnly
                    disabled
                  />
                )}
              </FormField>
            </div>

            <div className="admin-form-row-3">
              <FormField
                label={ADMIN_CATALOG_COPY.PRODUCTS.TYPE_LABEL}
                required
                error={fieldErrors['product.productType']?.[0]}
              >
                {(props) => (
                  <Select
                    {...props}
                    value={formState.productType}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        productType: e.target.value as AdminProductType,
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
                label={ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABEL}
                required
                error={fieldErrors['product.status']?.[0]}
              >
                {(props) => (
                  <Select
                    {...props}
                    value={formState.status}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        status: e.target.value as AdminCatalogStatus,
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

              <FormField
                label={ADMIN_CATALOG_COPY.PRODUCTS.SORT_LABEL}
                required
                error={fieldErrors['product.sortOrder']?.[0]}
              >
                {(props) => (
                  <Input
                    {...props}
                    type="number"
                    min={0}
                    max={9999}
                    value={formState.sortOrder}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        sortOrder: e.target.value,
                      }))
                    }
                  />
                )}
              </FormField>
            </div>

            <FormField
              label={ADMIN_CATALOG_COPY.PRODUCTS.SHORT_DESC_LABEL}
              error={fieldErrors['product.shortDescription']?.[0]}
            >
              {(props) => (
                <Input
                  {...props}
                  value={formState.shortDescription}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      shortDescription: e.target.value,
                    }))
                  }
                />
              )}
            </FormField>

            <FormField
              label={ADMIN_CATALOG_COPY.PRODUCTS.DESC_LABEL}
              error={fieldErrors['product.description']?.[0]}
            >
              {(props) => (
                <Textarea
                  {...props}
                  rows={3}
                  value={formState.description}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              )}
            </FormField>

            <div className="admin-form-row-2">
              <FormField label={ADMIN_CATALOG_COPY.PRODUCTS.INGREDIENTS_LABEL}>
                {(props) => (
                  <Textarea
                    {...props}
                    rows={2}
                    value={formState.ingredientsInfo}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        ingredientsInfo: e.target.value,
                      }))
                    }
                  />
                )}
              </FormField>

              <FormField label={ADMIN_CATALOG_COPY.PRODUCTS.STORAGE_LABEL}>
                {(props) => (
                  <Textarea
                    {...props}
                    rows={2}
                    value={formState.storageInstructions}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        storageInstructions: e.target.value,
                      }))
                    }
                  />
                )}
              </FormField>
            </div>

            <div className="admin-checkbox-group">
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={formState.needsOwnerReview}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      needsOwnerReview: e.target.checked,
                    }))
                  }
                />
                <span>{ADMIN_CATALOG_COPY.PRODUCTS.REVIEW_CHECKBOX}</span>
              </label>

              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={formState.isFeatured}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      isFeatured: e.target.checked,
                    }))
                  }
                />
                <span>{ADMIN_CATALOG_COPY.PRODUCTS.FEATURED_CHECKBOX}</span>
              </label>

              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={formState.isBestSeller}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      isBestSeller: e.target.checked,
                    }))
                  }
                />
                <span>{ADMIN_CATALOG_COPY.PRODUCTS.BEST_SELLER_CHECKBOX}</span>
              </label>

              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={formState.isNew}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      isNew: e.target.checked,
                    }))
                  }
                />
                <span>{ADMIN_CATALOG_COPY.PRODUCTS.NEW_CHECKBOX}</span>
              </label>
            </div>
          </Card>

          <Card className="admin-editor-item-card">
            <h3 className="admin-editor-heading">Kategori Produk</h3>
            {fieldErrors.categories?.[0] ? (
              <Feedback
                tone="error"
                title={fieldErrors.categories[0]}
                announce
              />
            ) : null}

            <div className="admin-category-assignment-grid">
              {aggregate.referenceData.categories.map((cat) => {
                const assigned = formState.categories.find(
                  (c) => c.categoryId === cat.id,
                );
                return (
                  <div key={cat.id} className="admin-category-assignment-row">
                    <label className="admin-checkbox-label">
                      <input
                        type="checkbox"
                        checked={Boolean(assigned)}
                        onChange={() => toggleCategory(cat.id)}
                      />
                      <span>
                        {cat.name} ({cat.status})
                      </span>
                    </label>
                    {assigned ? (
                      <label className="admin-checkbox-label">
                        <input
                          type="radio"
                          name="primary-category"
                          checked={assigned.isPrimary}
                          onChange={() => setPrimaryCategory(cat.id)}
                        />
                        <span>Utama</span>
                      </label>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>

          <AdminProductVariantsSection
            productType={formState.productType}
            variants={formState.variants}
            persistedVariantIds={persistedVariantIds}
            branchOfferCountByVariantId={branchOfferCountByVariantId}
            fieldErrors={fieldErrors}
            onChange={(nextVariants) =>
              setFormState((prev) => ({ ...prev, variants: nextVariants }))
            }
          />

          <AdminProductImagesSection
            images={formState.images}
            previewUrlByImageId={previewUrlsByImageId}
            variants={formState.variants}
            fieldErrors={fieldErrors}
            onChange={(nextImages, nextPreviewUrls) => {
              setFormState((prev) => ({ ...prev, images: nextImages }));
              if (nextPreviewUrls) {
                setPreviewUrlsByImageId(nextPreviewUrls);
              }
            }}
          />

          {formState.productType === 'bundle' ? (
            <AdminProductBundleSection
              productId={productId}
              variants={formState.variants}
              componentVariants={aggregate.referenceData.componentVariants}
              fieldErrors={fieldErrors}
              onChangeVariant={(variantIdx, nextVariant) =>
                setFormState((prev) => ({
                  ...prev,
                  variants: prev.variants.map((v, i) =>
                    i === variantIdx ? nextVariant : v,
                  ),
                }))
              }
            />
          ) : null}

          <AdminProductDietarySection
            variants={formState.variants}
            referenceDietaryTags={aggregate.referenceData.dietaryTags}
            referenceAllergens={aggregate.referenceData.allergens}
            fieldErrors={fieldErrors}
            onChangeVariant={(variantIdx, nextVariant) =>
              setFormState((prev) => ({
                ...prev,
                variants: prev.variants.map((v, i) =>
                  i === variantIdx ? nextVariant : v,
                ),
              }))
            }
          />

          <Card className="admin-editor-savebar">
            <div className="admin-inline-actions">
              <Button
                type="submit"
                variant="secondary"
                loading={saveMutation.isPending}
                loadingLabel="Menyimpan..."
              >
                <Save size={16} aria-hidden="true" />
                <span>{ADMIN_CATALOG_COPY.PRODUCT_EDITOR.SAVE_DRAFT_BTN}</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                loading={saveMutation.isPending}
                loadingLabel="Menyimpan & mempublikasikan..."
                onClick={() => void submitConfiguration('published')}
              >
                <CheckCircle2 size={16} aria-hidden="true" />
                <span>
                  {ADMIN_CATALOG_COPY.PRODUCT_EDITOR.SAVE_PUBLISH_BTN}
                </span>
              </Button>
            </div>
          </Card>
        </form>

        <aside
          className="admin-editor-preview-aside"
          aria-label={ADMIN_CATALOG_COPY.PRODUCT_EDITOR.PREVIEW_HEADING}
        >
          <Card tone="cream" className="admin-editor-preview-card">
            <h3 className="admin-editor-heading">
              {ADMIN_CATALOG_COPY.PRODUCT_EDITOR.PREVIEW_HEADING}
            </h3>
            <p className="admin-row-meta">
              {ADMIN_CATALOG_COPY.PRODUCT_EDITOR.PREVIEW_SUBTITLE}
            </p>
            <MenuProductCard
              product={livePreviewDto.cardProduct}
              previewImageUrl={livePreviewDto.previewImageUrl}
              hasBranchSelected
              branchCode="surabaya"
            />
            <p className="admin-row-meta">
              {ADMIN_CATALOG_COPY.PRODUCT_EDITOR.PREVIEW_NO_BRANCH_NOTE}
            </p>
          </Card>
        </aside>
      </div>
    </section>
  );
}
