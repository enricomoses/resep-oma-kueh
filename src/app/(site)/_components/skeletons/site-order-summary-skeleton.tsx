import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/components/order-summary.css';
import { cn } from '@/utils';

interface SiteOrderSummarySkeletonProps {
  titleWidth?: string;
  itemsSlot?: ReactNode;
  rowCount?: 2 | 3;
  ctaHeight?: string;
  hasTotalsTopBorder?: boolean;
  className?: string;
}

/** Shared sticky summary aside skeleton for CartSummary and CheckoutSidebarSummary. */
export function SiteOrderSummarySkeleton({
  titleWidth = '10rem',
  itemsSlot,
  rowCount = 2,
  ctaHeight = '3.25rem',
  hasTotalsTopBorder = false,
  className,
}: SiteOrderSummarySkeletonProps) {
  return (
    <aside className={cn('cart-summary-section', className)} aria-hidden="true">
      <Card className="cart-summary-card">
        <div className="cart-summary-title">
          <Skeleton width={titleWidth} height="1.125rem" />
        </div>

        {itemsSlot}

        <div
          className={cn(
            'cart-summary-rows',
            hasTotalsTopBorder && 'checkout-sidebar-totals',
          )}
        >
          {Array.from({ length: rowCount }, (_, idx) => (
            <div key={idx} className="cart-summary-row">
              <Skeleton
                width={idx === 0 ? '6.5rem' : '7rem'}
                height="0.875rem"
              />
              <Skeleton
                width={idx === 2 ? '8.5rem' : '5rem'}
                height="0.875rem"
              />
            </div>
          ))}

          <div className="cart-summary-row cart-summary-total">
            <Skeleton width="6.5rem" height="0.9375rem" />
            <Skeleton width="7.5rem" height="1.375rem" />
          </div>
        </div>

        <div className="site-skel-caveat-box">
          <Skeleton width="100%" height="0.8125rem" />
          <Skeleton width="78%" height="0.8125rem" />
        </div>

        <Skeleton width="100%" height={ctaHeight} radius="pill" />
      </Card>
    </aside>
  );
}
