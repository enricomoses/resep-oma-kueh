'use client';

import { ArrowLeft, ArrowRight, ShoppingBag } from 'lucide-react';

import { BranchStatusPill } from '@/components/common/branch/branch-status-pill';
import { NoBranchAlert } from '@/components/common/branch/no-branch-alert';
import { EmptyState } from '@/components/common/feedback/empty-state';
import { ErrorState } from '@/components/common/feedback/error-state';
import { LoadingState } from '@/components/common/feedback/loading-state';
import { PageHeader } from '@/components/common/layout/page-header';
import { ActionLink } from '@/components/ui/action-link';
import { Feedback } from '@/components/ui/feedback';
import { CART_COPY } from '@/constants/cart.constant';
import {
  CHECKOUT_COPY,
  CHECKOUT_WARNING_CODES,
} from '@/constants/checkout.constant';
import { ROUTES } from '@/constants/routes.constant';
import { useCheckoutFlow } from '@/hooks/use-checkout-flow';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';

import { CheckoutConsultationCard } from './checkout-consultation-card';
import { CheckoutFormCard } from './checkout-form-card';
import { CheckoutQuoteReviewCard } from './checkout-quote-review-card';
import { CheckoutSidebarSummary } from './checkout-sidebar-summary';

interface CheckoutViewProps {
  className?: string;
}

export function CheckoutView({ className }: CheckoutViewProps) {
  const flow = useCheckoutFlow();

  if (flow.isInitialLoading) {
    return (
      <main id="konten" className={cn('checkout-page', className)}>
        <div className="checkout-container">
          <LoadingState message={CART_COPY.LOADING_RESTORE} />
        </div>
      </main>
    );
  }

  if (flow.isEmptyCart) {
    return (
      <main id="konten" className={cn('checkout-page', className)}>
        <div className="checkout-container">
          <EmptyState
            icon={<ShoppingBag size={48} className="text-burgundy/60" />}
            title={CART_COPY.EMPTY_TITLE}
            description={CART_COPY.EMPTY_BODY}
            action={
              <ActionLink
                href={withBranch(ROUTES.MENU, flow.branchCode)}
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

  if (flow.isCartValidationError) {
    return (
      <main id="konten" className={cn('checkout-page', className)}>
        <div className="checkout-container">
          <ErrorState
            title="Gagal Memuat Ringkasan Keranjang"
            message={CART_COPY.ERROR_REVALIDATE}
            onRetry={() => void flow.refetchValidation()}
            retryLabel={CART_COPY.RETRY}
            className="my-8"
            actions={
              <ActionLink
                href={withBranch(ROUTES.CART, flow.branchCode)}
                variant="ghost"
                prefetch={false}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                {CHECKOUT_COPY.CTA_BACK_TO_CART}
              </ActionLink>
            }
          />
        </div>
      </main>
    );
  }

  const hasPriceChangedWarning = Boolean(
    flow.reviewedQuote?.warnings.some(
      (w) => w.code === CHECKOUT_WARNING_CODES.PRICE_CHANGED,
    ),
  );

  return (
    <main id="konten" className={cn('checkout-page', className)}>
      <div className="checkout-container">
        <div className="checkout-header">
          <div className="mb-3">
            <ActionLink
              href={withBranch(ROUTES.CART, flow.branchCode)}
              variant="ghost"
              size="sm"
              prefetch={false}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              {CHECKOUT_COPY.CTA_BACK_TO_CART}
            </ActionLink>
          </div>
          <PageHeader
            className="mb-0"
            titleClassName="cart-title"
            subtitleClassName="cart-subtitle"
            title={CHECKOUT_COPY.PAGE_TITLE}
            subtitle={CHECKOUT_COPY.PAGE_DESCRIPTION}
            aside={
              flow.selectedBranch ? (
                <BranchStatusPill
                  label={CART_COPY.BRANCH_LABEL}
                  branchName={flow.selectedBranch.name}
                />
              ) : null
            }
            alert={
              !flow.selectedBranch ? (
                <NoBranchAlert
                  message={CART_COPY.NO_BRANCH_WARNING}
                  className="mt-4"
                />
              ) : null
            }
          />
        </div>

        {flow.isFulfillmentDisabled && flow.selectedBranch ? (
          <CheckoutConsultationCard
            branchName={flow.selectedBranch.name}
            branchCode={flow.branchCode}
            whatsappHref={flow.consultationWhatsappHref}
          />
        ) : (
          <div className="checkout-main-grid">
            <div className="checkout-primary-col">
              {flow.clientErrorMessages.length > 0 || flow.serverError ? (
                <Feedback
                  tone="error"
                  title={
                    flow.serverError?.title ??
                    CHECKOUT_COPY.ERROR_FORM_SUMMARY_TITLE
                  }
                  announce
                  className="mb-6"
                >
                  {flow.serverError ? (
                    <p className="mt-1 text-sm">{flow.serverError.message}</p>
                  ) : null}
                  {flow.clientErrorMessages.length > 0 ||
                  (flow.serverError &&
                    flow.serverError.fieldList.length > 0) ? (
                    <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
                      {flow.clientErrorMessages.map((msg, idx) => (
                        <li key={`client-err-${idx}`}>{msg}</li>
                      ))}
                      {flow.serverError?.fieldList.map((msg, idx) => (
                        <li key={`server-err-${idx}`}>{msg}</li>
                      ))}
                    </ul>
                  ) : null}
                </Feedback>
              ) : null}

              {flow.hasBlockingConflicts ? (
                <Feedback
                  tone="error"
                  title={CART_COPY.CTA_CHECKOUT_DISABLED_CONFLICTS}
                  announce
                  className="mb-6"
                >
                  <p className="mt-1 text-sm">
                    Terdapat produk di keranjang yang sedang habis atau tidak
                    tersedia di cabang terpilih. Silakan kembali ke keranjang
                    untuk menyesuaikan item pesanan Anda.
                  </p>
                  <div className="mt-3">
                    <ActionLink
                      href={withBranch(ROUTES.CART, flow.branchCode)}
                      variant="secondary"
                      size="sm"
                      prefetch={false}
                    >
                      <ArrowLeft size={16} aria-hidden="true" />
                      {CHECKOUT_COPY.CTA_BACK_TO_CART}
                    </ActionLink>
                  </div>
                </Feedback>
              ) : null}

              <CheckoutFormCard
                register={flow.register}
                errors={flow.errors}
                selectedMethod={flow.selectedMethod}
                allowDelivery={flow.allowDelivery}
                allowPickup={flow.allowPickup}
                todayIso={flow.todayIso}
                maxDateIso={flow.maxDateIso}
                branchCode={flow.branchCode}
                hasReviewedQuote={Boolean(flow.reviewedQuote)}
                isBusy={flow.isBusy}
                disabled={
                  flow.isBusy ||
                  !flow.selectedBranch ||
                  flow.hasBlockingConflicts
                }
                onSubmit={flow.onSubmitForm}
              />

              {flow.reviewedQuote ? (
                <CheckoutQuoteReviewCard
                  quote={flow.reviewedQuote}
                  hasPriceChangedWarning={hasPriceChangedWarning}
                  handoffState={flow.handoffState}
                  copyStatus={flow.copyStatus}
                  shippingBanner={flow.shippingBanner}
                  customerName={flow.watchedValues.customerName ?? ''}
                  method={flow.selectedMethod}
                  requestedDate={
                    flow.watchedValues.requestedDate ?? flow.todayIso
                  }
                  branchCode={flow.branchCode}
                  isBusy={flow.isBusy}
                  hasBlockingConflicts={flow.hasBlockingConflicts}
                  previewTextareaRef={flow.previewTextareaRef}
                  onProceedToWhatsApp={flow.handleProceedToWhatsApp}
                  onReopenWhatsApp={flow.handleReopenWhatsApp}
                  onCopyMessage={flow.handleCopyMessage}
                />
              ) : null}
            </div>

            <CheckoutSidebarSummary
              totalQuantity={flow.totalQuantity}
              validatedLines={flow.validatedLines}
              estimatedSubtotalIdr={flow.estimatedSubtotalIdr}
              totalDiscountIdr={flow.totalDiscountIdr}
              estimatedTotalIdr={flow.estimatedTotalIdr}
              branchCode={flow.branchCode}
            />
          </div>
        )}
      </div>
    </main>
  );
}
