'use client';

import { Save } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ADMIN_BRANCH_LIMITS } from '@/constants/admin-catalog.constant';
import type {
  AdminAvailabilityOfferItem,
  AdminOfferAvailabilityStatus,
} from '@/types/admin-catalog';
import { formatIdr } from '@/utils';

interface AdminAvailabilityOfferFieldsProps {
  offer: AdminAvailabilityOfferItem;
  isOwner: boolean;
  isListed: boolean;
  availabilityStatus: AdminOfferAvailabilityStatus;
  stockText: string;
  basePriceText: string;
  overrideText: string;
  isDirty: boolean;
  saving: boolean;
  rowSuccess: string | null;
  onIsListedChange: (checked: boolean) => void;
  onStatusChange: (status: AdminOfferAvailabilityStatus) => void;
  onStockTextChange: (nextVal: string) => void;
  onBasePriceChange: (nextVal: string) => void;
  onOverrideChange: (nextVal: string) => void;
  onSave: () => void;
}

/** Inline control grid for editing branch listing, availability, stock, and prices for one SKU row. */
export function AdminAvailabilityOfferFields({
  offer,
  isOwner,
  isListed,
  availabilityStatus,
  stockText,
  basePriceText,
  overrideText,
  isDirty,
  saving,
  rowSuccess,
  onIsListedChange,
  onStatusChange,
  onStockTextChange,
  onBasePriceChange,
  onOverrideChange,
  onSave,
}: AdminAvailabilityOfferFieldsProps) {
  return (
    <div className="admin-availability-controls-grid">
      <div className="admin-availability-toggle-col">
        <label className="admin-checkbox-label">
          <input
            type="checkbox"
            checked={isListed}
            onChange={(event) => onIsListedChange(event.target.checked)}
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
              onStatusChange(event.target.value as AdminOfferAvailabilityStatus)
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
            onChange={(event) => onStockTextChange(event.target.value)}
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
                onChange={(event) => onBasePriceChange(event.target.value)}
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
                onChange={(event) => onOverrideChange(event.target.value)}
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
          onClick={onSave}
        >
          <Save size={15} aria-hidden="true" />
          <span>Simpan Baris</span>
        </Button>
        {rowSuccess && !isDirty ? (
          <Badge tone="success">{rowSuccess}</Badge>
        ) : null}
      </div>
    </div>
  );
}
