'use client';

import { useState } from 'react';

import { ADMIN_BRANCH_LIMITS } from '@/constants/admin-catalog.constant';
import { ApiClientError } from '@/lib/errors';
import type {
  AdminAvailabilityListResponse,
  AdminAvailabilityOfferItem,
  AdminBulkAvailabilityResponse,
  AdminOfferAvailabilityStatus,
  UpsertBranchAvailabilityInput,
} from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';

import { extractAdminMutationError } from './admin-mutation-error';
import {
  useAdminAvailability,
  useBulkUpdateAdminAvailability,
  useUpsertAdminAvailability,
} from './use-admin-catalog';

interface UseAdminAvailabilityManagerOptions {
  profile: AdminSessionProfile;
  initialData: AdminAvailabilityListResponse;
}

export function getAvailabilityOfferKey(
  item: AdminAvailabilityOfferItem,
): string {
  return `${item.branchId}:${item.variantId}`;
}

/** Controller hook managing branch availability filters, row mutations, and bulk updates. */
export function useAdminAvailabilityManager({
  profile,
  initialData,
}: UseAdminAvailabilityManagerOptions) {
  const isOwner = profile.role === 'owner';

  const [branchIdFilter, setBranchIdFilter] = useState<string>(
    profile.role === 'branch_admin' ? (profile.branchId ?? '') : '',
  );
  const [searchInput, setSearchInput] = useState('');
  const [listedFilter, setListedFilter] = useState<
    'all' | 'listed' | 'unlisted'
  >('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | AdminOfferAvailabilityStatus
  >('all');
  const [page, setPage] = useState(1);

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [bulkListed, setBulkListed] = useState<'listed' | 'unlisted'>('listed');
  const [bulkStatus, setBulkStatus] =
    useState<AdminOfferAvailabilityStatus>('available');
  const [bulkStockText, setBulkStockText] = useState('');
  const [bulkResult, setBulkResult] =
    useState<AdminBulkAvailabilityResponse | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const queryParams = {
    branchId: branchIdFilter || undefined,
    search: searchInput.trim() || undefined,
    availabilityStatus: statusFilter === 'all' ? undefined : statusFilter,
    listed: listedFilter,
    page,
    pageSize: ADMIN_BRANCH_LIMITS.AVAILABILITY_PAGE_SIZE,
  };

  const isDefaultQuery =
    (!branchIdFilter ||
      (profile.role === 'branch_admin' &&
        branchIdFilter === profile.branchId)) &&
    !searchInput.trim() &&
    statusFilter === 'all' &&
    listedFilter === 'all' &&
    page === 1;

  const availabilityQuery = useAdminAvailability(
    profile,
    queryParams,
    isDefaultQuery ? initialData : undefined,
  );
  const upsertMutation = useUpsertAdminAvailability();
  const bulkMutation = useBulkUpdateAdminAvailability();

  const data = availabilityQuery.data ?? initialData;
  const items = data.items;
  const branches = data.branches;
  const pagination = data.pagination;

  const selectedItems = items.filter((item) =>
    selectedKeys.includes(getAvailabilityOfferKey(item)),
  );

  function updateSearch(value: string) {
    setSearchInput(value);
    setPage(1);
  }

  function updateBranchFilter(value: string) {
    setBranchIdFilter(value);
    setPage(1);
  }

  function updateListedFilter(value: 'all' | 'listed' | 'unlisted') {
    setListedFilter(value);
    setPage(1);
  }

  function updateStatusFilter(value: 'all' | AdminOfferAvailabilityStatus) {
    setStatusFilter(value);
    setPage(1);
  }

  function toggleAllOnPage() {
    if (selectedItems.length === items.length && items.length > 0) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(items.map(getAvailabilityOfferKey));
    }
  }

  function toggleSelectedKey(key: string, checked: boolean) {
    setSelectedKeys((prev) =>
      checked
        ? Array.from(new Set([...prev, key]))
        : prev.filter((itemKey) => itemKey !== key),
    );
  }

  async function handleSaveRow(
    offer: AdminAvailabilityOfferItem,
    payload: UpsertBranchAvailabilityInput,
  ) {
    try {
      await upsertMutation.mutateAsync({
        branchId: offer.branchId,
        variantId: offer.variantId,
        payload,
      });
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 409) {
        void availabilityQuery.refetch();
      }
      throw error;
    }
  }

  async function handleBulkSubmit() {
    setBulkError(null);
    setBulkResult(null);

    if (selectedItems.length === 0) {
      setBulkError('Pilih minimal 1 SKU pada daftar untuk pembaruan massal.');
      return;
    }

    const parsedStock =
      bulkStockText.trim() === ''
        ? null
        : Number.parseInt(bulkStockText.trim(), 10);
    if (
      bulkStockText.trim() !== '' &&
      (parsedStock === null || Number.isNaN(parsedStock) || parsedStock < 0)
    ) {
      setBulkError('Stok massal harus bilangan bulat >= 0 atau kosong.');
      return;
    }

    try {
      const response = await bulkMutation.mutateAsync({
        items: selectedItems.map((item) => ({
          branchId: item.branchId,
          variantId: item.variantId,
          expectedOfferUpdatedAt: item.offerUpdatedAt,
          isListed: bulkListed === 'listed',
          availabilityStatus: bulkStatus,
          stockQuantity: parsedStock,
        })),
      });
      setBulkResult(response.data);
      if (response.data.succeededCount > 0) {
        setSelectedKeys([]);
      }
    } catch (error) {
      setBulkError(
        extractAdminMutationError(error, 'Pembaruan massal gagal dijalankan.')
          .message,
      );
    }
  }

  return {
    isOwner,
    items,
    branches,
    pagination,
    isFetching: availabilityQuery.isFetching,
    queryErrorMessage:
      availabilityQuery.error instanceof ApiClientError
        ? availabilityQuery.error.message
        : null,
    refetch: availabilityQuery.refetch,
    branchIdFilter,
    searchInput,
    listedFilter,
    statusFilter,
    selectedKeys,
    selectedCount: selectedItems.length,
    bulkListed,
    setBulkListed,
    bulkStatus,
    setBulkStatus,
    bulkStockText,
    setBulkStockText,
    bulkResult,
    bulkError,
    isBulkSubmitting: bulkMutation.isPending,
    setPage,
    updateSearch,
    updateBranchFilter,
    updateListedFilter,
    updateStatusFilter,
    toggleAllOnPage,
    toggleSelectedKey,
    handleSaveRow,
    handleBulkSubmit,
  };
}
