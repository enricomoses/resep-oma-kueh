'use client';

import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  ADMIN_BRANCH_LIMITS,
  ADMIN_CATALOG_COPY,
} from '@/constants/admin-catalog.constant';
import type {
  AdminBulkAvailabilityResponse,
  AdminOfferAvailabilityStatus,
} from '@/types/admin-catalog';
import { cn } from '@/utils';

interface AdminAvailabilityBulkCardProps {
  totalItemsCount: number;
  selectedCount: number;
  bulkListed: 'listed' | 'unlisted';
  bulkStatus: AdminOfferAvailabilityStatus;
  bulkStockText: string;
  bulkError: string | null;
  bulkResult: AdminBulkAvailabilityResponse | null;
  isSubmitting: boolean;
  onToggleAllPage: () => void;
  onBulkListedChange: (value: 'listed' | 'unlisted') => void;
  onBulkStatusChange: (value: AdminOfferAvailabilityStatus) => void;
  onBulkStockChange: (value: string) => void;
  onApplyBulk: () => void;
  className?: string;
}

export function AdminAvailabilityBulkCard({
  totalItemsCount,
  selectedCount,
  bulkListed,
  bulkStatus,
  bulkStockText,
  bulkError,
  bulkResult,
  isSubmitting,
  onToggleAllPage,
  onBulkListedChange,
  onBulkStatusChange,
  onBulkStockChange,
  onApplyBulk,
  className,
}: AdminAvailabilityBulkCardProps) {
  const allSelected = selectedCount === totalItemsCount && totalItemsCount > 0;
  const showBulkControls =
    selectedCount > 0 || Boolean(bulkError) || Boolean(bulkResult);

  return (
    <div
      className={cn(
        'admin-avail-bulk-bar',
        selectedCount > 0 && 'admin-avail-bulk-bar--active',
        className,
      )}
    >
      <div className="admin-avail-bulk-head">
        <div className="admin-avail-bulk-title-wrap">
          <h3 className="admin-avail-bulk-title">
            {ADMIN_CATALOG_COPY.AVAILABILITY.BULK_TITLE} ({selectedCount}{' '}
            dipilih)
          </h3>
          <p className="admin-avail-bulk-sub">
            {selectedCount > 0
              ? ADMIN_CATALOG_COPY.AVAILABILITY.BULK_HINT
              : 'Centang satu atau beberapa SKU di bawah untuk pembaruan massal.'}
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onToggleAllPage}
        >
          <span>
            {allSelected ? 'Batalkan Semua Pilihan' : 'Pilih Semua di Halaman'}
          </span>
        </Button>
      </div>

      {showBulkControls ? (
        <div className="admin-avail-bulk-controls">
          <FormField id="bulk-listed" label="Tampil Massal">
            {(fieldProps) => (
              <Select
                {...fieldProps}
                sizeVariant="compact"
                value={bulkListed}
                onChange={(event) =>
                  onBulkListedChange(
                    event.target.value as 'listed' | 'unlisted',
                  )
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
                sizeVariant="compact"
                value={bulkStatus}
                onChange={(event) =>
                  onBulkStatusChange(
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
                sizeVariant="compact"
                type="number"
                min={0}
                max={ADMIN_BRANCH_LIMITS.MAX_STOCK_QUANTITY}
                placeholder="Tidak dilacak"
                value={bulkStockText}
                onChange={(event) => onBulkStockChange(event.target.value)}
              />
            )}
          </FormField>

          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={selectedCount === 0 || isSubmitting}
            loading={isSubmitting}
            loadingLabel="Memproses massal..."
            onClick={onApplyBulk}
          >
            <span>Terapkan ke {selectedCount} SKU Terpilih</span>
          </Button>
        </div>
      ) : null}

      {bulkError ? <Feedback tone="error" title={bulkError} announce /> : null}

      {bulkResult && bulkResult.failedCount > 0 ? (
        <Feedback
          tone="error"
          title={`${bulkResult.succeededCount} dari ${bulkResult.totalCount} SKU berhasil diperbarui; ${bulkResult.failedCount} gagal.`}
          announce
        >
          <ul className="admin-bulk-failure-list">
            {bulkResult.results
              .filter((res) => !res.ok)
              .map((res) => (
                <li key={`${res.branchId}:${res.variantId}`}>
                  <code>{res.variantId}</code>: <span>{res.message}</span>
                </li>
              ))}
          </ul>
        </Feedback>
      ) : null}
    </div>
  );
}
