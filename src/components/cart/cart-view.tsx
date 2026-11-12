'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  ShoppingBag,
  Store,
  Trash2,
} from 'lucide-react';
import { MediaPlaceholder } from '@/app/_components';
import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Feedback } from '@/components/ui/feedback';
import { Quantity } from '@/components/ui/quantity';
import { CART_CONFLICTS, CART_COPY } from '@/constants/cart.constant';
import { ROUTES } from '@/constants/routes.constant';
import { useBranches } from '@/hooks/use-branches';
import { useCart } from '@/hooks/use-cart';
import { withBranch } from '@/utils/branch-url';
import { cn, formatIdr } from '@/utils';
import type { CartValidatedLine } from '@/types/cart';

interface CartViewProps {
  className?: string;
}

export function CartView({ className }: CartViewProps) {
  const {
    hasHydrated,
    lines,
    totalQuantity,
    updateQuantity,
    removeLine,
    clearCart,
    isValidating,
    isValidationError,
    validatedLines,
    estimatedSubtotalIdr,
    totalDiscountIdr,
    estimatedTotalIdr,
    hasBlockingConflicts,
    refetchValidation,
  } = useCart();

  const { selected: selectedBranch, code: branchCode } = useBranches();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  // 1. Loading / Hydration State (distinct from empty cart)
  if (
    !hasHydrated ||
    (isValidating && lines.length > 0 && validatedLines.length === 0)
  ) {
    return (
      <main id="konten" className={cn('cart-page', className)}>
        <div className="cart-container">
          <div className="cart-loading-state" role="status" aria-live="polite">
            <div className="cart-spinner" aria-hidden="true" />
            <p className="cart-loading-text">{CART_COPY.LOADING_RESTORE}</p>
          </div>
        </div>
      </main>
    );
  }

  // 2. Empty Cart State
  if (lines.length === 0) {
    return (
      <main id="konten" className={cn('cart-page', className)}>
        <div className="cart-container">
          <Card className="cart-empty-state">
            <div className="cart-empty-icon-wrap" aria-hidden="true">
              <ShoppingBag size={48} className="text-burgundy/60" />
            </div>
            <h1 className="cart-empty-title">{CART_COPY.EMPTY_TITLE}</h1>
            <p className="cart-empty-body">{CART_COPY.EMPTY_BODY}</p>
            <div className="mt-6">
              <ActionLink
                href={withBranch(ROUTES.MENU, branchCode)}
                variant="primary"
                prefetch={false}
              >
                {CART_COPY.CTA_BROWSE_MENU}
                <ArrowRight size={18} aria-hidden="true" />
              </ActionLink>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  // 3. Validation Error State (Offline or Upstream Outage, distinct from empty)
  if (isValidationError && validatedLines.length === 0) {
    return (
      <main id="konten" className={cn('cart-page', className)}>
        <div className="cart-container">
          <Feedback
            tone="error"
            title="Gagal Memuat Keranjang"
            className="my-8"
          >
            <p className="mb-4 text-sm">{CART_COPY.ERROR_REVALIDATE}</p>
            <Button
              variant="secondary"
              onClick={() => void refetchValidation()}
              className="inline-flex items-center gap-2"
            >
              <RotateCcw size={16} aria-hidden="true" />
              {CART_COPY.RETRY}
            </Button>
          </Feedback>
        </div>
      </main>
    );
  }

  return (
    <main id="konten" className={cn('cart-page', className)}>
      <div className="cart-container">
        {/* Page Header */}
        <div className="cart-header">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <h1 className="cart-title">{CART_COPY.PAGE_TITLE}</h1>
              <p className="cart-subtitle">
                {totalQuantity} item dalam pesanan Anda
              </p>
            </div>
            {selectedBranch ? (
              <div className="cart-branch-pill">
                <Store size={16} aria-hidden="true" />
                <span>
                  {CART_COPY.BRANCH_LABEL}:{' '}
                  <strong>{selectedBranch.name}</strong>
                </span>
              </div>
            ) : null}
          </div>

          {!selectedBranch ? (
            <div className="cart-alert-no-branch mt-4" role="alert">
              <AlertTriangle
                size={18}
                className="shrink-0 text-amber-600"
                aria-hidden="true"
              />
              <p className="text-xs font-medium text-amber-900">
                {CART_COPY.NO_BRANCH_WARNING}
              </p>
            </div>
          ) : null}
        </div>

        {/* 2-Column Layout */}
        <div className="cart-main-grid">
          {/* Left Column: Cart Items List */}
          <section
            className="cart-items-section"
            aria-label="Daftar Produk di Keranjang"
          >
            <div className="space-y-4">
              {validatedLines.map((line: CartValidatedLine) => {
                const isSoldOut = line.conflict === CART_CONFLICTS.SOLD_OUT;
                const isNotOffered =
                  line.conflict === CART_CONFLICTS.NOT_OFFERED;
                const isArchived = line.conflict === CART_CONFLICTS.ARCHIVED;
                const isComponentUnavailable =
                  line.conflict === CART_CONFLICTS.COMPONENT_UNAVAILABLE;
                const isPriceChanged =
                  line.conflict === CART_CONFLICTS.PRICE_CHANGED;

                const hasConflict = line.conflict !== CART_CONFLICTS.NONE;
                const itemDetailHref = withBranch(
                  `${ROUTES.MENU}/${encodeURIComponent(line.productSlug)}`,
                  branchCode,
                );

                return (
                  <Card
                    key={line.lineId}
                    className={cn(
                      'cart-item-card',
                      hasConflict && 'cart-item-card-conflict',
                    )}
                  >
                    <div className="cart-item-grid">
                      {/* Thumbnail */}
                      <div className="cart-item-thumbnail-wrap">
                        <MediaPlaceholder
                          caption={line.imageAlt}
                          className="cart-item-media"
                        />
                      </div>

                      {/* Content */}
                      <div className="cart-item-details">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <Link
                              href={itemDetailHref}
                              className="cart-item-product-name"
                            >
                              {line.productName}
                            </Link>
                            <p className="cart-item-variant-label">
                              {line.sizeLabel || line.variantName}
                            </p>
                          </div>

                          {/* Conflict Badges */}
                          {isSoldOut ? (
                            <Badge tone="danger">
                              {CART_COPY.CONFLICT_SOLD_OUT}
                            </Badge>
                          ) : isNotOffered ? (
                            <Badge tone="danger">
                              {CART_COPY.CONFLICT_NOT_OFFERED}
                            </Badge>
                          ) : isComponentUnavailable ? (
                            <Badge tone="danger">
                              {CART_COPY.CONFLICT_COMPONENT_UNAVAILABLE}
                            </Badge>
                          ) : isArchived ? (
                            <Badge tone="danger">
                              {CART_COPY.CONFLICT_ARCHIVED}
                            </Badge>
                          ) : isPriceChanged ? (
                            <Badge tone="accent">
                              {CART_COPY.CONFLICT_PRICE_CHANGED}
                            </Badge>
                          ) : line.availabilityStatus === 'unconfirmed' ? (
                            <Badge tone="accent">Konfirmasi via WA</Badge>
                          ) : null}
                        </div>

                        {/* Bundle Breakdown */}
                        {line.bundleBreakdown &&
                        line.bundleBreakdown.length > 0 ? (
                          <div className="cart-item-bundle-breakdown">
                            <p className="text-burgundy font-semibold">
                              Komposisi Pilihan:
                            </p>
                            <ul className="text-cocoa list-inside list-disc space-y-0.5 text-xs">
                              {line.bundleBreakdown.map((item, idx) => (
                                <li key={idx}>
                                  {item.slotOrGroup}: {item.label} (
                                  {item.quantity} potong)
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {/* Price & Quantity Controls */}
                        <div className="cart-item-footer">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-burgundy font-serif text-lg font-bold">
                                {formatIdr(line.effectiveUnitPriceIdr)}
                              </span>
                              {line.unitGrossIdr >
                              line.effectiveUnitPriceIdr ? (
                                <span className="text-cocoa/60 text-xs line-through">
                                  {formatIdr(line.unitGrossIdr)}
                                </span>
                              ) : null}
                            </div>
                            <span className="text-cocoa/70 text-[11px]">
                              per unit
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <Quantity
                              value={line.quantity}
                              min={1}
                              max={99}
                              onChange={(newQty) =>
                                updateQuantity(line.lineId, newQty)
                              }
                              label={`Jumlah ${line.productName}`}
                            />

                            <div className="text-right">
                              <span className="text-burgundy block font-serif text-base font-bold">
                                {formatIdr(line.subtotalIdr)}
                              </span>
                              <Button
                                variant="ghost"
                                onClick={() => removeLine(line.lineId)}
                                className="cart-item-remove-btn"
                                aria-label={`Hapus ${line.productName} dari keranjang`}
                              >
                                <Trash2 size={14} aria-hidden="true" />
                                <span>{CART_COPY.REMOVE_ITEM}</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="mt-6 flex justify-between">
              <Button
                variant="secondary"
                onClick={() => setClearDialogOpen(true)}
                className="text-xs"
              >
                {CART_COPY.CLEAR_CART}
              </Button>
              <ActionLink
                href={withBranch(ROUTES.MENU, branchCode)}
                variant="ghost"
                prefetch={false}
                className="text-xs"
              >
                + Tambah Produk Lain
              </ActionLink>
            </div>
          </section>

          {/* Right Column: Order Summary */}
          <aside
            className="cart-summary-section"
            aria-label="Ringkasan Pesanan"
          >
            <Card className="cart-summary-card">
              <h2 className="cart-summary-title">{CART_COPY.SUMMARY_TITLE}</h2>

              <dl className="cart-summary-rows">
                <div className="cart-summary-row">
                  <dt>{CART_COPY.SUBTOTAL}</dt>
                  <dd className="text-cocoa font-medium">
                    {formatIdr(estimatedSubtotalIdr)}
                  </dd>
                </div>

                {totalDiscountIdr > 0 ? (
                  <div className="cart-summary-row text-burgundy">
                    <dt>{CART_COPY.DISCOUNT}</dt>
                    <dd className="font-semibold">
                      -{formatIdr(totalDiscountIdr)}
                    </dd>
                  </div>
                ) : null}

                <div className="cart-summary-row cart-summary-total">
                  <dt>{CART_COPY.TOTAL_ESTIMATE}</dt>
                  <dd>{formatIdr(estimatedTotalIdr)}</dd>
                </div>
              </dl>

              {/* Price Caveat */}
              <p className="cart-price-caveat">{CART_COPY.PRICE_CAVEAT_NOTE}</p>

              {/* Checkout Action Button */}
              <div className="mt-6">
                {hasBlockingConflicts ||
                !selectedBranch ||
                lines.length === 0 ? (
                  <Button disabled className="w-full justify-center">
                    {hasBlockingConflicts
                      ? CART_COPY.CTA_CHECKOUT_DISABLED_CONFLICTS
                      : !selectedBranch
                        ? CART_COPY.NO_BRANCH_WARNING
                        : CART_COPY.CTA_CHECKOUT}
                    <ArrowRight size={18} aria-hidden="true" />
                  </Button>
                ) : (
                  <ActionLink
                    href={withBranch(ROUTES.CHECKOUT, branchCode)}
                    variant="primary"
                    prefetch={false}
                    className="w-full justify-center"
                  >
                    {CART_COPY.CTA_CHECKOUT}
                    <ArrowRight size={18} aria-hidden="true" />
                  </ActionLink>
                )}
              </div>
            </Card>
          </aside>
        </div>

        {/* Clear Cart Confirmation Dialog */}
        <Dialog
          open={clearDialogOpen}
          onOpenChange={setClearDialogOpen}
          title={CART_COPY.CLEAR_CART}
          description={CART_COPY.CLEAR_CART_CONFIRM}
        >
          <div className="site-dialog-actions mt-6 flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setClearDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                clearCart();
                setClearDialogOpen(false);
              }}
            >
              Ya, Kosongkan
            </Button>
          </div>
        </Dialog>
      </div>
    </main>
  );
}
