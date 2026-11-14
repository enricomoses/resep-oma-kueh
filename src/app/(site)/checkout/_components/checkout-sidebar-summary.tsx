'use client';

import { ArrowLeft } from 'lucide-react';

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
              <div className="flex justify-between gap-2 text-sm">
                <span className="text-burgundy font-medium">
                  {line.productName} ({line.sizeLabel || line.variantName})
                </span>
                <span className="font-semibold">
                  {formatIdr(line.subtotalIdr)}
                </span>
              </div>
              <p className="text-cocoa text-xs">
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
          className="mt-4 border-t border-[var(--border-sand)] pt-4"
        />

        <p className="cart-price-caveat">{CART_COPY.PRICE_CAVEAT_NOTE}</p>

        <div className="mt-4">
          <ActionLink
            href={withBranch(ROUTES.CART, branchCode)}
            variant="secondary"
            size="sm"
            prefetch={false}
            className="w-full justify-center"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            {CHECKOUT_COPY.CTA_BACK_TO_CART}
          </ActionLink>
        </div>
      </Card>
    </aside>
  );
}
