'use client';

import { useState } from 'react';

import { Feedback } from '@/components/ui/feedback';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ApiClientError } from '@/lib/errors';
import { notifyError, notifySuccess } from '@/lib/toast';
import type {
  AdminAvailabilityOfferItem,
  AdminOfferAvailabilityStatus,
  UpsertBranchAvailabilityInput,
} from '@/types/admin-catalog';
import { cn, formatIdr } from '@/utils';
import { isZeroStockStatusValid } from '@/utils/admin-branches';
import { upsertBranchAvailabilitySchema } from '@/validations/admin-catalog.schema';

import { AdminAvailabilityOfferFields } from './admin-availability-offer-fields';

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

/** Editable row for managing branch listing, availability, stock, and price per SKU offer. */
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

    if (
      stockText.trim() !== '' &&
      (Number.isNaN(parsedStock) || parsedStock! < 0)
    ) {
      const msg = 'Stok harus bilangan bulat non-negatif atau dikosongkan.';
      setRowError(msg);
      notifyError(msg, {
        toastId: `avail-err-${offer.branchId}-${offer.variantId}`,
      });
      return;
    }

    const stockQuantity = stockText.trim() === '' ? null : parsedStock;
    if (!isZeroStockStatusValid(stockQuantity, availabilityStatus)) {
      const msg =
        ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.ZERO_STOCK_CONTRADICTION;
      setRowError(msg);
      notifyError(msg, {
        toastId: `avail-err-${offer.branchId}-${offer.variantId}`,
      });
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
      notifySuccess(
        `Ketersediaan ${offer.productName} (${offer.variantLabel}) berhasil disimpan.`,
        { toastId: `avail-ok-${offer.branchId}-${offer.variantId}` },
      );
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Gagal menyimpan pembaruan SKU cabang.';
      setRowError(message);
      notifyError(message, {
        toastId: `avail-err-${offer.branchId}-${offer.variantId}`,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <li
      className={cn(
        'admin-avail-row',
        selected && 'admin-avail-row--selected',
        className,
      )}
    >
      <div className="admin-avail-row-head">
        <div className="admin-avail-title-group">
          <label className="admin-avail-checkbox-wrap">
            <input
              type="checkbox"
              aria-label={`Pilih ${offer.productName} ${offer.variantLabel} (${offer.branchName})`}
              checked={selected}
              onChange={(event) => onToggleSelected(event.target.checked)}
            />
          </label>
          <div className="admin-avail-identity">
            <div className="admin-avail-name-line">
              <h3 className="admin-avail-name admin-wrap-text">
                {offer.productName} — {offer.variantLabel}
              </h3>
              <span className="admin-avail-branch-chip">
                {offer.branchName}
              </span>
              {offer.productStatus === 'draft' ? (
                <span className="admin-avail-draft-tag">· Produk Draf</span>
              ) : null}
            </div>
            <p className="admin-avail-sku-meta">
              SKU: <code className="admin-avail-sku-code">{offer.sku}</code>
            </p>
          </div>
        </div>

        <div className="admin-avail-summary">
          <p
            className={cn(
              'admin-avail-status',
              `admin-avail-status--${availabilityStatus}`,
            )}
          >
            <span className="admin-avail-status-dot" aria-hidden="true" />
            <span>{STATUS_LABELS[availabilityStatus]}</span>
          </p>
          <p className="admin-avail-price-preview">
            {formatIdr(effectivePreviewPrice)}
            {offer.priceOverrideIdr !== null ? (
              <span className="admin-avail-override-note">
                {' '}
                (Override Cabang)
              </span>
            ) : null}
          </p>
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
    </li>
  );
}
