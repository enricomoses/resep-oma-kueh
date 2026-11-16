'use client';

import { ArrowLeft, Info } from 'lucide-react';

import { OrderTotalsSummary } from '@/components/common/commerce/order-totals-summary';
import { ActionLink } from '@/components/ui/action-link';
import { Card } from '@/components/ui/card';
import { CART_COPY } from '@/constants/cart.constant';
import { CHECKOUT_COPY } from '@/constants/checkout.constant';
import { ROUTES } from '@/constants/routes.constant';
import type { CartValidatedLine } from '@/types/cart';
import { cn, formatIdr } from '@/utils';
import { withBranch } from '@/utils/branch-url';

interface CheckoutSidebarSummaryProps {
  totalQuantity: number;
  validatedLines: readonly CartValidatedLine[];
  estimatedSubtotalIdr: number;
  totalDiscountIdr: number;
  estimatedTotalIdr: number;
  branchCode: string | null | undefined;
  className?: string;
}

export function CheckoutSidebarSummary({
  totalQuantity,
  validatedLines,
  estimatedSubtotalIdr,
  totalDiscountIdr,
  estimatedTotalIdr,
  branchCode,
  className,
}: CheckoutSidebarSummaryProps) {
  return (
    <aside
      className={cn('cart-summary-section', className)}
      aria-label="Ringkasan Keranjang"
    >
      <Card className="cart-summary-card">
        <h2 className="cart-summary-title">
          {CART_COPY.SUMMARY_TITLE} ({totalQuantity} item)
        </h2>

        <div className="checkout-sidebar-items">
          {validatedLines.map((line) => (
            <div key={line.lineId} className="checkout-sidebar-item">
              <div className="checkout-sidebar-item-row">
                <span className="checkout-sidebar-item-name">
                  {line.productName} ({line.sizeLabel || line.variantName})
                </span>
                <span className="checkout-sidebar-item-price">
                  {formatIdr(line.subtotalIdr)}
                </span>
              </div>
              <p className="checkout-sidebar-item-qty">
                {line.quantity} × {formatIdr(line.effectiveUnitPriceIdr)}
              </p>
            </div>
          ))}
        </div>

        <OrderTotalsSummary
          subtotalIdr={estimatedSubtotalIdr}
          discountIdr={totalDiscountIdr}
          estimatedTotalIdr={estimatedTotalIdr}
          showShippingPending
          className="checkout-sidebar-totals"
        />

        <div className="cart-price-caveat">
          <Info
            size={15}
            aria-hidden="true"
            className="cart-price-caveat-icon"
          />
          <p>{CART_COPY.PRICE_CAVEAT_NOTE}</p>
        </div>

        <ActionLink
          href={withBranch(ROUTES.CART, branchCode)}
          variant="secondary"
          size="sm"
          prefetch={false}
          className="cart-summary-cta"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {CHECKOUT_COPY.CTA_BACK_TO_CART}
        </ActionLink>
      </Card>
    </aside>
  );
}
