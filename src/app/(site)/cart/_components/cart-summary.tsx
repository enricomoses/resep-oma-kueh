'use client';

import { ArrowRight } from 'lucide-react';

import { OrderTotalsSummary } from '@/components/common/commerce/order-totals-summary';
import { ActionLink } from '@/components/ui/action-link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { CART_COPY } from '@/constants/cart.constant';
import { ROUTES } from '@/constants/routes.constant';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';

interface CartSummaryProps {
  estimatedSubtotalIdr: number;
  totalDiscountIdr: number;
  estimatedTotalIdr: number;
  shippingBanner: { title: string; body: string } | null;
  hasBlockingConflicts: boolean;
  hasBranch: boolean;
  isCartEmpty: boolean;
  branchCode: string | null | undefined;
  className?: string;
}

export function CartSummary({
  estimatedSubtotalIdr,
  totalDiscountIdr,
  estimatedTotalIdr,
  shippingBanner,
  hasBlockingConflicts,
  hasBranch,
  isCartEmpty,
  branchCode,
  className,
}: CartSummaryProps) {
  const isCheckoutDisabled = hasBlockingConflicts || !hasBranch || isCartEmpty;
  const disabledLabel = hasBlockingConflicts
    ? CART_COPY.CTA_CHECKOUT_DISABLED_CONFLICTS
    : !hasBranch
      ? CART_COPY.NO_BRANCH_WARNING
      : CART_COPY.CTA_CHECKOUT;

  return (
    <aside
      className={cn('cart-summary-section', className)}
      aria-label="Ringkasan Pesanan"
    >
      <Card className="cart-summary-card">
        <h2 className="cart-summary-title">{CART_COPY.SUMMARY_TITLE}</h2>

        <OrderTotalsSummary
          subtotalIdr={estimatedSubtotalIdr}
          discountIdr={totalDiscountIdr}
          estimatedTotalIdr={estimatedTotalIdr}
        />

        <p className="cart-price-caveat">{CART_COPY.PRICE_CAVEAT_NOTE}</p>

        {shippingBanner ? (
          <Feedback tone="info" title={shippingBanner.title} className="mt-3">
            <p className="text-xs">{shippingBanner.body}</p>
          </Feedback>
        ) : null}

        <div className="mt-6">
          {isCheckoutDisabled ? (
            <Button disabled className="w-full justify-center">
              {disabledLabel}
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
  );
}
