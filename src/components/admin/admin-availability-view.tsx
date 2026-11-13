'use client';

import { RefreshCw, Save } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  ADMIN_BRANCH_LIMITS,
  ADMIN_CATALOG_COPY,
} from '@/constants/admin-catalog.constant';
import {
  useAdminAvailability,
  useBulkUpdateAdminAvailability,
  useUpsertAdminAvailability,
} from '@/hooks/use-admin-catalog';
import { ApiClientError } from '@/lib/errors';
import type {
  AdminAvailabilityListResponse,
  AdminAvailabilityOfferItem,
  AdminBulkAvailabilityResponse,
  AdminOfferAvailabilityStatus,
  UpsertBranchAvailabilityInput,
} from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';
import { cn, formatIdr } from '@/utils';
import { isZeroStockStatusValid } from '@/utils/admin-branches';
import { upsertBranchAvailabilitySchema } from '@/validations/admin-catalog.schema';

interface AdminAvailabilityViewProps {
  profile: AdminSessionProfile;
  initialData: AdminAvailabilityListResponse;
  className?: string;
}

const STATUS_BADGE_TONE: Record<
  AdminOfferAvailabilityStatus,
  'success' | 'accent' | 'neutral'
> = {
  available: 'success',
  sold_out: 'accent',
  unconfirmed: 'neutral',
};

const STATUS_LABELS: Record<AdminOfferAvailabilityStatus, string> = {
  available: 'Tersedia',
  sold_out: 'Habis (Sold Out)',
  unconfirmed: 'Belum Dikonfirmasi',
};

function offerRowKey(item: AdminAvailabilityOfferItem): string {
  return `${item.branchId}:${item.variantId}`;
}

interface OfferRowCardProps {
  offer: AdminAvailabilityOfferItem;
  isOwner: boolean;
  selected: boolean;
  onToggleSelected: (checked: boolean) => void;
  onSaveRow: (
    offer: AdminAvailabilityOfferItem,
    payload: UpsertBranchAvailabilityInput,
  ) => Promise<void>;
}

function OfferRowCard({
  offer,
  isOwner,
  selected,
  onToggleSelected,
  onSaveRow,
}: OfferRowCardProps) {
  const [isListed, setIsListed] = useState(offer.isListed);
  const [availabilityStatus, setAvailabilityStatus] =
    useState<AdminOfferAvailabilityStatus>(offer.availabilityStatus);
  const [stockText, setStockText] = useState(
    offer.stockQuantity === null ? '' : String(offer.stockQuantity),
  );
  const [basePriceText, setBasePriceText] = useState(
    String(offer.basePriceIdr),
  );
  const [overrideText, setOverrideText] = useState(
    offer.priceOverrideIdr === null ? '' : String(offer.priceOverrideIdr),
  );
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [rowSuccess, setRowSuccess] = useState<string | null>(null);

  const parsedStock =
    stockText.trim() === '' ? null : Number.parseInt(stockText.trim(), 10);
  const effectivePreviewPrice =
    isOwner && overrideText.trim() !== '' && !Number.isNaN(Number(overrideText))
      ? Number.parseInt(overrideText.trim(), 10)
      : isOwner &&
          basePriceText.trim() !== '' &&
          !Number.isNaN(Number(basePriceText))
        ? Number.parseInt(basePriceText.trim(), 10)
        : offer.effectivePriceIdr;

  const isDirty =
    isListed !== offer.isListed ||
    availabilityStatus !== offer.availabilityStatus ||
    (stockText.trim() === '' ? null : parsedStock) !== offer.stockQuantity ||
    (isOwner &&
      (basePriceText.trim() !== String(offer.basePriceIdr) ||
        (overrideText.trim() === ''
          ? null
          : Number.parseInt(overrideText.trim(), 10)) !==
          offer.priceOverrideIdr));

  async function handleSave() {
    setRowError(null);
    setRowSuccess(null);

    if (
      stockText.trim() !== '' &&
      (Number.isNaN(parsedStock) || parsedStock! < 0)
    ) {
      setRowError('Stok harus bilangan bulat non-negatif atau dikosongkan.');
      return;
    }

    const stockQuantity = stockText.trim() === '' ? null : parsedStock;
    if (!isZeroStockStatusValid(stockQuantity, availabilityStatus)) {
      setRowError(
        ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.ZERO_STOCK_CONTRADICTION,
      );
      return;
    }

    const basePayload: UpsertBranchAvailabilityInput = {
      expectedOfferUpdatedAt: offer.offerUpdatedAt,
      isListed,
      availabilityStatus,
      stockQuantity,
    };

    if (isOwner) {
      const parsedBase = Number.parseInt(basePriceText.trim(), 10);
      const parsedOverride =
        overrideText.trim() === ''
          ? null
          : Number.parseInt(overrideText.trim(), 10);

      if (Number.isNaN(parsedBase) || parsedBase < 0) {
        setRowError('Harga dasar harus bilangan bulat valid dalam Rupiah.');
        return;
      }
      if (
        overrideText.trim() !== '' &&
        (parsedOverride === null ||
          Number.isNaN(parsedOverride) ||
          parsedOverride < 0)
      ) {
        setRowError('Override harga harus bilangan bulat valid atau kosong.');
        return;
      }

      if (parsedBase !== offer.basePriceIdr) {
        basePayload.expectedVariantUpdatedAt = offer.variantUpdatedAt;
        basePayload.basePriceIdr = parsedBase;
      }
      basePayload.priceOverrideIdr = parsedOverride;
    }

    const parsed = upsertBranchAvailabilitySchema.safeParse(basePayload);
    if (!parsed.success) {
      setRowError(
        parsed.error.issues[0]?.message ?? 'Data penawaran cabang tidak valid.',
      );
      return;
    }

    setSaving(true);
    try {
      await onSaveRow(offer, parsed.data);
      setRowSuccess('Tersimpan');
    } catch (error) {
      if (error instanceof ApiClientError) {
        setRowError(error.message);
      } else {
        setRowError('Gagal menyimpan pembaruan SKU cabang.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card tone="surface" className="admin-availability-card">
      <div className="admin-availability-card-header">
        <div className="admin-availability-title-group">
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              aria-label={`Pilih ${offer.productName} ${offer.variantLabel} (${offer.branchName})`}
              checked={selected}
              onChange={(event) => onToggleSelected(event.target.checked)}
            />
          </label>
          <div>
            <div className="admin-row-title-row">
              <h3 className="admin-row-title admin-wrap-text">
                {offer.productName} — {offer.variantLabel}
              </h3>
              <Badge tone="neutral">{offer.branchName}</Badge>
              <Badge tone={STATUS_BADGE_TONE[availabilityStatus]}>
                {STATUS_LABELS[availabilityStatus]}
              </Badge>
              {offer.productStatus === 'draft' ? (
                <Badge tone="neutral">Produk Draf</Badge>
              ) : null}
            </div>
            <p className="admin-row-meta">
              SKU: <code>{offer.sku}</code> · Harga Efektif:{' '}
              <strong>{formatIdr(effectivePreviewPrice)}</strong>
              {offer.priceOverrideIdr !== null ? ' (Override Cabang)' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="admin-availability-controls-grid">
        <div className="admin-availability-toggle-col">
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={isListed}
              onChange={(event) => setIsListed(event.target.checked)}
            />
            <span>Tampil di Cabang</span>
          </label>
          <span className="admin-row-meta">
            {offer.hasOfferRow ? 'Sudah terdaftar' : 'Belum ada penawaran'}
          </span>
        </div>

        <FormField
          id={`avail-status-${offer.branchId}-${offer.variantId}`}
          label="Status Ketersediaan"
        >
          {(fieldProps) => (
            <Select
              {...fieldProps}
              value={availabilityStatus}
              onChange={(event) =>
                setAvailabilityStatus(
                  event.target.value as AdminOfferAvailabilityStatus,
                )
              }
            >
              <option value="available">Tersedia</option>
              <option value="sold_out">Habis (Sold Out)</option>
              <option value="unconfirmed">Belum Dikonfirmasi</option>
            </Select>
          )}
        </FormField>

        <FormField
          id={`avail-stock-${offer.branchId}-${offer.variantId}`}
          label="Stok (Kosong = Tidak Dilacak)"
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              type="number"
              min={0}
              max={ADMIN_BRANCH_LIMITS.MAX_STOCK_QUANTITY}
              placeholder="Tidak dilacak"
              value={stockText}
              onChange={(event) => {
                const nextVal = event.target.value;
                setStockText(nextVal);
                if (nextVal.trim() === '0') {
                  setAvailabilityStatus('sold_out');
                }
              }}
            />
          )}
        </FormField>

        {isOwner ? (
          <>
            <FormField
              id={`avail-base-${offer.branchId}-${offer.variantId}`}
              label="Harga Dasar (Rp)"
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="number"
                  min={0}
                  max={ADMIN_BRANCH_LIMITS.MAX_PRICE_IDR}
                  value={basePriceText}
                  onChange={(event) => setBasePriceText(event.target.value)}
                />
              )}
            </FormField>

            <FormField
              id={`avail-override-${offer.branchId}-${offer.variantId}`}
              label="Override Cabang (Rp)"
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="number"
                  min={0}
                  max={ADMIN_BRANCH_LIMITS.MAX_PRICE_IDR}
                  placeholder="Ikuti harga dasar"
                  value={overrideText}
                  onChange={(event) => setOverrideText(event.target.value)}
                />
              )}
            </FormField>
          </>
        ) : (
          <div className="admin-staff-price-readonly">
            <span className="admin-stat-label">Harga Cabang</span>
            <strong>{formatIdr(offer.effectivePriceIdr)}</strong>
          </div>
        )}

        <div className="admin-availability-save-col">
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={!isDirty || saving}
            loading={saving}
            loadingLabel="Menyimpan..."
            onClick={() => void handleSave()}
          >
            <Save size={15} aria-hidden="true" />
            <span>Simpan Baris</span>
          </Button>
          {rowSuccess && !isDirty ? (
            <Badge tone="success">{rowSuccess}</Badge>
          ) : null}
        </div>
      </div>

      {rowError ? <Feedback tone="error" title={rowError} announce /> : null}
    </Card>
  );
}

export function AdminAvailabilityView({
  profile,
  initialData,
  className,
}: AdminAvailabilityViewProps) {
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
    selectedKeys.includes(offerRowKey(item)),
  );

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
      if (error instanceof ApiClientError) {
        setBulkError(error.message);
      } else {
        setBulkError('Pembaruan massal gagal dijalankan.');
      }
    }
  }

  return (
    <section className={cn('admin-section', className)}>
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">
            {ADMIN_CATALOG_COPY.AVAILABILITY.TITLE}
          </h2>
          <p className="admin-section-subtitle">
            {ADMIN_CATALOG_COPY.AVAILABILITY.SUBTITLE}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={availabilityQuery.isFetching}
          loadingLabel="Memuat ulang..."
          onClick={() => {
            void availabilityQuery.refetch();
          }}
        >
          <RefreshCw size={16} aria-hidden="true" />
          <span>Muat Ulang</span>
        </Button>
      </div>

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

      <Card tone="surface" className="admin-filter-card">
        <div className="admin-filter-grid">
          <FormField id="avail-search" label="Cari Produk / SKU">
            {(fieldProps) => (
              <Input
                {...fieldProps}
                value={searchInput}
                placeholder="Nama kue, slug, SKU, atau ukuran..."
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  setPage(1);
                }}
              />
            )}
          </FormField>

          {isOwner ? (
            <FormField id="avail-branch-filter" label="Cabang">
              {(fieldProps) => (
                <Select
                  {...fieldProps}
                  value={branchIdFilter}
                  onChange={(event) => {
                    setBranchIdFilter(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Semua Cabang</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
          ) : (
            <div className="admin-staff-branch-pill">
              <span className="admin-stat-label">Cabang Tugas</span>
              <Badge tone="accent">
                {branches[0]?.name ?? profile.branchName ?? 'Cabang Terbatas'}
              </Badge>
            </div>
          )}

          <FormField id="avail-listed-filter" label="Status Tampil">
            {(fieldProps) => (
              <Select
                {...fieldProps}
                value={listedFilter}
                onChange={(event) => {
                  setListedFilter(
                    event.target.value as 'all' | 'listed' | 'unlisted',
                  );
                  setPage(1);
                }}
              >
                <option value="all">Semua</option>
                <option value="listed">Tampil di Cabang</option>
                <option value="unlisted">Disembunyikan</option>
              </Select>
            )}
          </FormField>

          <FormField id="avail-status-filter" label="Status Ketersediaan">
            {(fieldProps) => (
              <Select
                {...fieldProps}
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value as 'all' | AdminOfferAvailabilityStatus,
                  );
                  setPage(1);
                }}
              >
                <option value="all">Semua Status</option>
                <option value="available">Tersedia</option>
                <option value="sold_out">Habis (Sold Out)</option>
                <option value="unconfirmed">Belum Dikonfirmasi</option>
              </Select>
            )}
          </FormField>
        </div>
      </Card>

      <Card tone="cream" className="admin-bulk-card">
        <div className="admin-section-header">
          <div>
            <h3 className="admin-row-title">
              {ADMIN_CATALOG_COPY.AVAILABILITY.BULK_TITLE} (
              {selectedItems.length} dipilih)
            </h3>
            <p className="admin-row-meta">
              {ADMIN_CATALOG_COPY.AVAILABILITY.BULK_HINT}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              if (selectedItems.length === items.length && items.length > 0) {
                setSelectedKeys([]);
              } else {
                setSelectedKeys(items.map(offerRowKey));
              }
            }}
          >
            <span>
              {selectedItems.length === items.length && items.length > 0
                ? 'Batalkan Semua Pilihan'
                : 'Pilih Semua di Halaman'}
            </span>
          </Button>
        </div>

        <div className="admin-bulk-controls">
          <FormField id="bulk-listed" label="Tampil Massal">
            {(fieldProps) => (
              <Select
                {...fieldProps}
                value={bulkListed}
                onChange={(event) =>
                  setBulkListed(event.target.value as 'listed' | 'unlisted')
                }
              >
                <option value="listed">Tampil di Cabang</option>
                <option value="unlisted">Disembunyikan</option>
              </Select>
            )}
          </FormField>

          <FormField id="bulk-status" label="Status Massal">
            {(fieldProps) => (
              <Select
                {...fieldProps}
                value={bulkStatus}
                onChange={(event) =>
                  setBulkStatus(
                    event.target.value as AdminOfferAvailabilityStatus,
                  )
                }
              >
                <option value="available">Tersedia</option>
                <option value="sold_out">Habis (Sold Out)</option>
                <option value="unconfirmed">Belum Dikonfirmasi</option>
              </Select>
            )}
          </FormField>

          <FormField id="bulk-stock" label="Stok Massal (Opsional)">
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="number"
                min={0}
                max={ADMIN_BRANCH_LIMITS.MAX_STOCK_QUANTITY}
                placeholder="Tidak dilacak"
                value={bulkStockText}
                onChange={(event) => setBulkStockText(event.target.value)}
              />
            )}
          </FormField>

          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={selectedItems.length === 0 || bulkMutation.isPending}
            loading={bulkMutation.isPending}
            loadingLabel="Memproses massal..."
            onClick={() => void handleBulkSubmit()}
          >
            <span>Terapkan ke {selectedItems.length} SKU Terpilih</span>
          </Button>
        </div>

        {bulkError ? (
          <Feedback tone="error" title={bulkError} announce />
        ) : null}

        {bulkResult ? (
          <Feedback
            tone={bulkResult.failedCount > 0 ? 'error' : 'success'}
            title={`${bulkResult.succeededCount} dari ${bulkResult.totalCount} SKU berhasil diperbarui; ${bulkResult.failedCount} gagal.`}
            announce
          >
            {bulkResult.failedCount > 0 ? (
              <ul className="admin-bulk-failure-list">
                {bulkResult.results
                  .filter((res) => !res.ok)
                  .map((res) => (
                    <li key={`${res.branchId}:${res.variantId}`}>
                      <code>{res.variantId}</code>: <span>{res.message}</span>
                    </li>
                  ))}
              </ul>
            ) : null}
          </Feedback>
        ) : null}
      </Card>

      {availabilityQuery.error instanceof ApiClientError ? (
        <Feedback
          tone="error"
          title={availabilityQuery.error.message}
          announce
        />
      ) : null}

      {items.length === 0 ? (
        <Card tone="cream" className="admin-empty-card">
          <p className="admin-section-subtitle">
            Tidak ada penawaran SKU yang cocok dengan filter cabang saat ini.
          </p>
        </Card>
      ) : (
        <div className="admin-list-stack">
          {items.map((item) => {
            const key = offerRowKey(item);
            return (
              <OfferRowCard
                key={`${key}:${item.offerUpdatedAt ?? 'none'}:${item.variantUpdatedAt}`}
                offer={item}
                isOwner={isOwner}
                selected={selectedKeys.includes(key)}
                onToggleSelected={(checked) => {
                  setSelectedKeys((prev) =>
                    checked
                      ? Array.from(new Set([...prev, key]))
                      : prev.filter((itemKey) => itemKey !== key),
                  );
                }}
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
