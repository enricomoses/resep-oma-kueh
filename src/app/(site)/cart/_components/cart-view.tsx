'use client';

import { ArrowRight, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { BranchStatusPill } from '@/components/common/branch/branch-status-pill';
import { ConfirmDialog } from '@/components/common/feedback/confirm-dialog';
import { EmptyState } from '@/components/common/feedback/empty-state';
import { ErrorState } from '@/components/common/feedback/error-state';
import { LoadingState } from '@/components/common/feedback/loading-state';
import { NoBranchAlert } from '@/components/common/branch/no-branch-alert';
import { BackLink } from '@/components/common/layout/back-link';
import { PageHeader } from '@/components/common/layout/page-header';
import { ActionLink } from '@/components/ui/action-link';
import { Button } from '@/components/ui/button';
import { CART_COPY } from '@/constants/cart.constant';
import { PRODUCT_DETAIL_COPY } from '@/constants/catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { useBranches } from '@/hooks/use-branches';
import { useCart } from '@/hooks/use-cart';
import { usePublicPromotions } from '@/hooks/queries/use-promotions';
import { notifyInfo, notifySuccess } from '@/lib/toast';
import '@/styles/components/order-summary.css';
import '@/styles/features/cart.css';
import type { CartValidatedLine } from '@/types/cart';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';

import { CartItemCard } from './cart-item-card';
import { CartSummary } from './cart-summary';

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
  const { data: promoData } = usePublicPromotions(
    branchCode,
    Boolean(branchCode),
  );
  const shippingBanner = promoData?.shippingBanner ?? null;
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  if (
    !hasHydrated ||
    (isValidating && lines.length > 0 && validatedLines.length === 0)
  ) {
    return (
      <main id="konten" className={cn('cart-page', className)}>
        <div className="cart-container">
          <LoadingState message={CART_COPY.LOADING_RESTORE} />
        </div>
      </main>
    );
  }

  if (lines.length === 0) {
    return (
      <main id="konten" className={cn('cart-page', className)}>
        <div className="cart-container">
          <EmptyState
            size="lg"
            headingAs="h1"
            icon={
              <ShoppingBag size={36} strokeWidth={1.65} aria-hidden="true" />
            }
            title={CART_COPY.EMPTY_TITLE}
            description={CART_COPY.EMPTY_BODY}
            action={
              <ActionLink
                href={withBranch(ROUTES.MENU, branchCode)}
                variant="primary"
                prefetch={false}
              >
                {CART_COPY.CTA_BROWSE_MENU}
                <ArrowRight size={18} aria-hidden="true" />
              </ActionLink>
            }
          />
        </div>
      </main>
    );
  }

  if (isValidationError && validatedLines.length === 0) {
    return (
      <main id="konten" className={cn('cart-page', className)}>
        <div className="cart-container">
          <ErrorState
            title="Gagal Memuat Keranjang"
            message={CART_COPY.ERROR_REVALIDATE}
            onRetry={() => void refetchValidation()}
            retryLabel={CART_COPY.RETRY}
            className="my-8"
          />
        </div>
      </main>
    );
  }

  return (
    <main id="konten" className={cn('cart-page', className)}>
      <div className="cart-container">
        <nav aria-label="Navigasi ke menu" className="cart-header-nav">
          <BackLink
            href={withBranch(ROUTES.MENU, branchCode)}
            prefetch={false}
            label={PRODUCT_DETAIL_COPY.BACK_TO_MENU}
          />
        </nav>

        <PageHeader
          className="cart-header"
          titleClassName="cart-title"
          subtitleClassName="cart-subtitle"
          title={CART_COPY.PAGE_TITLE}
          subtitle={`${totalQuantity} item dalam pesanan Anda`}
          aside={
            selectedBranch ? (
              <BranchStatusPill
                label={CART_COPY.BRANCH_LABEL}
                branchName={selectedBranch.name}
              />
            ) : null
          }
          alert={
            !selectedBranch ? (
              <NoBranchAlert message={CART_COPY.NO_BRANCH_WARNING} />
            ) : null
          }
        />

        <div className="cart-main-grid">
          <section
            className="cart-items-section"
            aria-label="Daftar Produk di Keranjang"
          >
            <div className="cart-items-toolbar">
              <h2 className="cart-items-toolbar-title">
                Daftar Produk ({validatedLines.length})
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setClearDialogOpen(true)}
                className="cart-clear-btn"
              >
                <Trash2 size={14} aria-hidden="true" />
                {CART_COPY.CLEAR_CART}
              </Button>
            </div>

            <div className="cart-items-list">
              {validatedLines.map((line: CartValidatedLine) => (
                <CartItemCard
                  key={line.lineId}
                  line={line}
                  branchCode={branchCode}
                  onUpdateQuantity={updateQuantity}
                  onRemoveLine={(lineId) => {
                    removeLine(lineId);
                    notifyInfo(
                      `${line.productName} (${line.variantName}) dihapus dari keranjang.`,
                      { toastId: 'cart-line-removed' },
                    );
                  }}
                />
              ))}
            </div>

            <div className="cart-items-footer">
              <ActionLink
                href={withBranch(ROUTES.MENU, branchCode)}
                variant="secondary"
                size="sm"
                prefetch={false}
                className="cart-add-more-link"
              >
                <Plus size={15} aria-hidden="true" />
                Tambah Produk Lain
              </ActionLink>
            </div>
          </section>

          <CartSummary
            estimatedSubtotalIdr={estimatedSubtotalIdr}
            totalDiscountIdr={totalDiscountIdr}
            estimatedTotalIdr={estimatedTotalIdr}
            shippingBanner={shippingBanner}
            hasBlockingConflicts={hasBlockingConflicts}
            hasBranch={Boolean(selectedBranch)}
            isCartEmpty={lines.length === 0}
            branchCode={branchCode}
          />
        </div>

        <ConfirmDialog
          open={clearDialogOpen}
          onOpenChange={setClearDialogOpen}
          title={CART_COPY.CLEAR_CART}
          description={CART_COPY.CLEAR_CART_CONFIRM}
          cancelLabel="Batal"
          confirmLabel="Ya, Kosongkan"
          onConfirm={() => {
            clearCart();
            setClearDialogOpen(false);
            notifySuccess('Keranjang berhasil dikosongkan.', {
              toastId: 'cart-cleared',
            });
          }}
        />
      </div>
    </main>
  );
}
