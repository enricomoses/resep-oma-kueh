'use client';

import { CheckCircle2, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { useAdminProductEditorManager } from '@/hooks/use-admin-product-editor-manager';
import type { AdminProductEditorAggregate } from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';
import { cn } from '@/utils';

import { AdminProductBasicCard } from './admin-product-basic-card';
import { AdminProductBundleSection } from './admin-product-bundle-section';
import { AdminProductCategoriesCard } from './admin-product-categories-card';
import { AdminProductDietarySection } from './admin-product-dietary-section';
import { AdminProductEditorHeader } from './admin-product-editor-header';
import { AdminProductEditorPreviewAside } from './admin-product-editor-preview-aside';
import { AdminProductImagesSection } from './admin-product-images-section';
import { AdminProductVariantsSection } from './admin-product-variants-section';

interface AdminProductEditorViewProps {
  profile: AdminSessionProfile;
  productId: string;
  initialAggregate: AdminProductEditorAggregate;
  className?: string;
}

/** Thin composition view for editing full product configuration and live preview. */
export function AdminProductEditorView({
  profile,
  productId,
  initialAggregate,
  className,
}: AdminProductEditorViewProps) {
  const {
    aggregate,
    formState,
    setFormState,
    previewUrlsByImageId,
    fieldErrors,
    saveError,
    errorEntries,
    isConflictError,
    saveNotice,
    isFetching,
    isSaving,
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
  } = useAdminProductEditorManager({
    profile,
    productId,
    initialAggregate,
  });

  return (
    <section className={cn('admin-section', className)}>
      <AdminProductEditorHeader
        productName={aggregate.product.name}
        productSlug={aggregate.product.slug}
        status={formState.status}
        expectedUpdatedAt={formState.expectedUpdatedAt}
        isFetching={isFetching}
        onReloadLatest={() => void handleReloadLatest()}
      />

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
          <AdminProductBasicCard
            slug={aggregate.product.slug}
            formState={formState}
            setFormState={setFormState}
            fieldErrors={fieldErrors}
          />

          <AdminProductCategoriesCard
            referenceCategories={aggregate.referenceData.categories}
            assignedCategories={formState.categories}
            errorMessage={fieldErrors.categories?.[0]}
            onToggleCategory={toggleCategory}
            onSetPrimaryCategory={setPrimaryCategory}
          />

          <AdminProductVariantsSection
            productType={formState.productType}
            variants={formState.variants}
            persistedVariantIds={persistedVariantIds}
            branchOfferCountByVariantId={branchOfferCountByVariantId}
            fieldErrors={fieldErrors}
            onChange={updateVariants}
          />

          <AdminProductImagesSection
            images={formState.images}
            previewUrlByImageId={previewUrlsByImageId}
            variants={formState.variants}
            fieldErrors={fieldErrors}
            onChange={updateImages}
          />

          {formState.productType === 'bundle' ? (
            <AdminProductBundleSection
              productId={productId}
              variants={formState.variants}
              componentVariants={aggregate.referenceData.componentVariants}
              fieldErrors={fieldErrors}
              onChangeVariant={updateVariantAt}
            />
          ) : null}

          <AdminProductDietarySection
            variants={formState.variants}
            referenceDietaryTags={aggregate.referenceData.dietaryTags}
            referenceAllergens={aggregate.referenceData.allergens}
            fieldErrors={fieldErrors}
            onChangeVariant={updateVariantAt}
          />

          <Card className="admin-editor-savebar">
            <div className="admin-inline-actions">
              <Button
                type="submit"
                variant="secondary"
                loading={isSaving}
                loadingLabel="Menyimpan..."
              >
                <Save size={16} aria-hidden="true" />
                <span>{ADMIN_CATALOG_COPY.PRODUCT_EDITOR.SAVE_DRAFT_BTN}</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                loading={isSaving}
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

        <AdminProductEditorPreviewAside
          product={livePreviewDto.cardProduct}
          previewImageUrl={livePreviewDto.previewImageUrl}
        />
      </div>
    </section>
  );
}
