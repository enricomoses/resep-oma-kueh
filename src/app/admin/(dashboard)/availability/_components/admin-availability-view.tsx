'use client';

import { RefreshCw } from 'lucide-react';

import { AdminSectionHeader } from '@/app/admin/(dashboard)/_components/admin-section-header';
import { EmptyState } from '@/components/common/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import {
  getAvailabilityOfferKey,
  useAdminAvailabilityManager,
} from '@/hooks/use-admin-availability-manager';
import type { AdminAvailabilityListResponse } from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';
import { cn } from '@/utils';

import { AdminAvailabilityBulkCard } from './admin-availability-bulk-card';
import { AdminAvailabilityFilters } from './admin-availability-filters';
import { AdminAvailabilityOfferCard } from './admin-availability-offer-card';

interface AdminAvailabilityViewProps {
  profile: AdminSessionProfile;
  initialData: AdminAvailabilityListResponse;
  className?: string;
}

/** Thin composition view for branch SKU availability filtering, single-row save, and bulk updates. */
export function AdminAvailabilityView({
  profile,
  initialData,
  className,
}: AdminAvailabilityViewProps) {
  const {
    isOwner,
    items,
    branches,
    pagination,
    isFetching,
    queryErrorMessage,
    refetch,
    branchIdFilter,
    searchInput,
    listedFilter,
    statusFilter,
    selectedKeys,
    selectedCount,
    bulkListed,
    setBulkListed,
    bulkStatus,
    setBulkStatus,
    bulkStockText,
    setBulkStockText,
    bulkResult,
    bulkError,
    isBulkSubmitting,
    setPage,
    updateSearch,
    updateBranchFilter,
    updateListedFilter,
    updateStatusFilter,
    toggleAllOnPage,
    toggleSelectedKey,
    handleSaveRow,
    handleBulkSubmit,
  } = useAdminAvailabilityManager({
    profile,
    initialData,
  });

  return (
    <section className={cn('admin-section', className)}>
      <AdminSectionHeader
        title={ADMIN_CATALOG_COPY.AVAILABILITY.TITLE}
        description={ADMIN_CATALOG_COPY.AVAILABILITY.SUBTITLE}
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={isFetching}
            loadingLabel="Memuat ulang..."
            onClick={() => void refetch()}
          >
            <RefreshCw size={16} aria-hidden="true" />
            <span>Muat Ulang</span>
          </Button>
        }
      />

      {!isOwner ? (
        <Card tone="cream" className="admin-quick-actions-card">
          <p className="admin-section-subtitle">
            {ADMIN_CATALOG_COPY.AVAILABILITY.STAFF_SCOPE_NOTE}
          </p>
        </Card>
      ) : null}

      <p className="admin-row-meta">
        {ADMIN_CATALOG_COPY.AVAILABILITY.NULL_STOCK_HINT}
      </p>

      <AdminAvailabilityFilters
        isOwner={isOwner}
        branches={branches}
        fallbackBranchName={profile.branchName}
        searchInput={searchInput}
        branchIdFilter={branchIdFilter}
        listedFilter={listedFilter}
        statusFilter={statusFilter}
        onSearchChange={updateSearch}
        onBranchChange={updateBranchFilter}
        onListedChange={updateListedFilter}
        onStatusChange={updateStatusFilter}
      />

      <AdminAvailabilityBulkCard
        totalItemsCount={items.length}
        selectedCount={selectedCount}
        bulkListed={bulkListed}
        bulkStatus={bulkStatus}
        bulkStockText={bulkStockText}
        bulkError={bulkError}
        bulkResult={bulkResult}
        isSubmitting={isBulkSubmitting}
        onToggleAllPage={toggleAllOnPage}
        onBulkListedChange={setBulkListed}
        onBulkStatusChange={setBulkStatus}
        onBulkStockChange={setBulkStockText}
        onApplyBulk={() => void handleBulkSubmit()}
      />

      {queryErrorMessage ? (
        <Feedback tone="error" title={queryErrorMessage} announce />
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          tone="cream"
          className="admin-empty-card"
          title="Tidak ada penawaran SKU yang cocok dengan filter cabang saat ini."
        />
      ) : (
        <div className="admin-list-stack">
          {items.map((item) => {
            const key = getAvailabilityOfferKey(item);
            return (
              <AdminAvailabilityOfferCard
                key={`${key}:${item.offerUpdatedAt ?? 'none'}:${item.variantUpdatedAt}`}
                offer={item}
                isOwner={isOwner}
                selected={selectedKeys.includes(key)}
                onToggleSelected={(checked) => toggleSelectedKey(key, checked)}
                onSaveRow={handleSaveRow}
              />
            );
          })}
        </div>
      )}

      {pagination.totalPages > 1 ? (
        <div className="admin-pagination-row">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            <span>Sebelumnya</span>
          </Button>
          <span className="admin-row-meta">
            Halaman {pagination.page} dari {pagination.totalPages} (
            {pagination.totalCount} SKU)
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() =>
              setPage((prev) => Math.min(pagination.totalPages, prev + 1))
            }
          >
            <span>Berikutnya</span>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
