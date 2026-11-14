'use client';

import { Plus, RefreshCw, SlidersHorizontal } from 'lucide-react';

import { AdminSectionHeader } from '@/app/admin/(dashboard)/_components/admin-section-header';
import { ConfirmDialog } from '@/components/common/feedback/confirm-dialog';
import { ActionLink } from '@/components/ui/action-link';
import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { useAdminProductsManager } from '@/hooks/use-admin-products-manager';
import type {
  AdminCategoryListResponse,
  AdminProductListResponse,
} from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';
import { cn } from '@/utils';

import { AdminProductDialog } from './admin-product-dialog';
import { AdminProductFilterBar } from './admin-product-filter-bar';
import { AdminProductListSection } from './admin-product-list-section';

interface AdminProductsViewProps {
  profile: AdminSessionProfile;
  initialProducts: AdminProductListResponse;
  initialCategories: AdminCategoryListResponse;
  className?: string;
}

export function AdminProductsView({
  profile,
  initialProducts,
  initialCategories,
  className,
}: AdminProductsViewProps) {
  const mgr = useAdminProductsManager({
    profile,
    initialProducts,
    initialCategories,
  });

  return (
    <section className={cn('admin-section', className)}>
      <AdminSectionHeader
        title={ADMIN_CATALOG_COPY.PRODUCTS.TITLE}
        description={ADMIN_CATALOG_COPY.PRODUCTS.SUBTITLE}
        actions={
          <div className="admin-inline-actions">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={mgr.isFetching}
              loadingLabel={ADMIN_CATALOG_COPY.PRODUCTS.REFRESH}
              onClick={mgr.handleRefresh}
            >
              <RefreshCw size={16} aria-hidden="true" />
              <span>{ADMIN_CATALOG_COPY.PRODUCTS.REFRESH}</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={mgr.openCreateDialog}
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
        }
      />

      <Feedback tone="info" title="Ruang lingkup data inti produk (F16)">
        {ADMIN_CATALOG_COPY.PRODUCTS.NO_PRICE_NOTICE}
      </Feedback>

      {mgr.actionBanner ? (
        <Feedback
          tone={mgr.actionBanner.tone}
          title={mgr.actionBanner.message}
          announce
        />
      ) : null}

      {mgr.listErrorMessage ? (
        <Feedback tone="error" title={mgr.listErrorMessage} announce />
      ) : null}

      <AdminProductFilterBar
        searchInput={mgr.searchInput}
        onSearchChange={mgr.setSearchInput}
        statusFilter={mgr.statusFilter}
        onStatusChange={mgr.onStatusFilterChange}
        categoryFilter={mgr.categoryFilter}
        onCategoryChange={mgr.onCategoryFilterChange}
        categories={mgr.categories}
      />

      <AdminProductListSection
        productPage={mgr.productPage}
        isFetching={mgr.isFetching}
        onEdit={mgr.openEditDialog}
        onArchive={mgr.onRequestArchive}
        onPrevPage={mgr.onPrevPage}
        onNextPage={mgr.onNextPage}
      />

      <AdminProductDialog
        open={mgr.formOpen}
        onOpenChange={mgr.setFormOpen}
        formState={mgr.formState}
        setFormState={mgr.setFormState}
        onNameChange={mgr.handleNameChange}
        onSubmit={mgr.handleFormSubmit}
        onReloadLatest={mgr.handleReloadLatest}
        conflictBanner={mgr.conflictBanner}
        formError={mgr.formError}
        fieldErrors={mgr.fieldErrors}
        isSaving={mgr.isSaving}
      />

      <ConfirmDialog
        open={Boolean(mgr.archiveTarget)}
        onOpenChange={(open) => {
          if (!open) mgr.setArchiveTarget(null);
        }}
        title={ADMIN_CATALOG_COPY.PRODUCTS.ARCHIVE_CONFIRM_TITLE}
        description={ADMIN_CATALOG_COPY.PRODUCTS.ARCHIVE_CONFIRM_DESC}
        error={mgr.archiveError}
        cancelLabel={ADMIN_CATALOG_COPY.PRODUCTS.CANCEL}
        confirmLabel={ADMIN_CATALOG_COPY.PRODUCTS.ARCHIVE_CONFIRM_SUBMIT}
        loadingLabel="Mengarsipkan..."
        isLoading={mgr.isArchiving}
        actionsClassName="admin-modal-actions"
        onConfirm={mgr.handleConfirmArchive}
      >
        {mgr.archiveTarget ? (
          <p className="admin-row-title admin-wrap-text">
            {mgr.archiveTarget.name} (<code>{mgr.archiveTarget.slug}</code>)
          </p>
        ) : null}
      </ConfirmDialog>
    </section>
  );
}
