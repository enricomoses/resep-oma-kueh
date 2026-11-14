'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ApiClientError } from '@/lib/errors';
import type {
  AdminAvailabilityOfferItem,
  AdminOfferAvailabilityStatus,
  UpsertBranchAvailabilityInput,
} from '@/types/admin-catalog';
import { cn, formatIdr } from '@/utils';
import { isZeroStockStatusValid } from '@/utils/admin-branches';
import { upsertBranchAvailabilitySchema } from '@/validations/admin-catalog.schema';

import { AdminAvailabilityOfferFields } from './admin-availability-offer-fields';

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

interface AdminAvailabilityOfferCardProps {
  offer: AdminAvailabilityOfferItem;
  isOwner: boolean;
  selected: boolean;
  onToggleSelected: (checked: boolean) => void;
  onSaveRow: (
    offer: AdminAvailabilityOfferItem,
    payload: UpsertBranchAvailabilityInput,
  ) => Promise<void>;
  className?: string;
}

/** Editable card for managing branch listing, availability, stock, and price per SKU offer. */
export function AdminAvailabilityOfferCard({
  offer,
  isOwner,
  selected,
  onToggleSelected,
  onSaveRow,
  className,
}: AdminAvailabilityOfferCardProps) {
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
    <Card tone="surface" className={cn('admin-availability-card', className)}>
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

      <AdminAvailabilityOfferFields
        offer={offer}
        isOwner={isOwner}
        isListed={isListed}
        availabilityStatus={availabilityStatus}
        stockText={stockText}
        basePriceText={basePriceText}
        overrideText={overrideText}
        isDirty={isDirty}
        saving={saving}
        rowSuccess={rowSuccess}
        onIsListedChange={setIsListed}
        onStatusChange={setAvailabilityStatus}
        onStockTextChange={(nextVal) => {
          setStockText(nextVal);
          if (nextVal.trim() === '0') {
            setAvailabilityStatus('sold_out');
          }
        }}
        onBasePriceChange={setBasePriceText}
        onOverrideChange={setOverrideText}
        onSave={() => void handleSave()}
      />

      {rowError ? <Feedback tone="error" title={rowError} announce /> : null}
    </Card>
  );
}
