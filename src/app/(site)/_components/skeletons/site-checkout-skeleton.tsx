import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BOUNDARY_COPY } from '@/constants/seo.constant';
import '@/styles/features/checkout.css';
import { cn } from '@/utils';

import { SiteOrderSummarySkeleton } from './site-order-summary-skeleton';
import { SitePageHeaderSkeleton } from './site-page-header-skeleton';
import { SiteSkeletonFrame } from './site-skeleton-frame';

interface SiteCheckoutSkeletonProps {
  label?: string;
  className?: string;
}

/** 1:1 layout skeleton matching CheckoutView form card and sticky cart summary sidebar. */
export function SiteCheckoutSkeleton({
  label = BOUNDARY_COPY.LOADING_LABEL,
  className,
}: SiteCheckoutSkeletonProps) {
  return (
    <SiteSkeletonFrame label={label} className={cn('checkout-page', className)}>
      <div className="checkout-container" aria-hidden="true">
        <div className="checkout-header">
          <div className="checkout-header-nav">
            <Skeleton width="9.5rem" height="1rem" />
          </div>
          <SitePageHeaderSkeleton compactTitle subtitleLines={1} hasAside />
        </div>

        <div className="checkout-main-grid">
          <div className="checkout-primary-col">
            <Card className="checkout-form-card">
              <div className="checkout-card-header">
                <Skeleton width="13.5rem" height="1.25rem" />
                <Skeleton width="min(32rem, 92%)" height="0.875rem" />
              </div>

              <div className="checkout-form">
                <div className="checkout-form-row-2">
                  <div className="site-skel-field">
                    <Skeleton width="6.5rem" height="0.875rem" />
                    <Skeleton width="100%" height="3rem" radius="md" />
                  </div>
                  <div className="site-skel-field">
                    <Skeleton width="7.5rem" height="0.875rem" />
                    <Skeleton width="100%" height="3rem" radius="md" />
                  </div>
                </div>

                <div className="checkout-form-row-2">
                  <div className="site-skel-field">
                    <Skeleton width="7rem" height="0.875rem" />
                    <Skeleton width="100%" height="3rem" radius="md" />
                  </div>
                  <div className="site-skel-field">
                    <Skeleton width="6.5rem" height="0.875rem" />
                    <Skeleton width="100%" height="3rem" radius="md" />
                  </div>
                </div>

                <div className="site-skel-field">
                  <Skeleton width="10rem" height="0.875rem" />
                  <Skeleton width="100%" height="5.5rem" radius="md" />
                </div>

                <div className="site-skel-field">
                  <Skeleton width="6.5rem" height="0.875rem" />
                  <Skeleton width="100%" height="4.25rem" radius="md" />
                </div>

                <div className="checkout-form-footer">
                  <div className="checkout-consent-block">
                    <Skeleton
                      width="1.0625rem"
                      height="1.0625rem"
                      radius="sm"
                    />
                    <div className="checkout-consent-copy">
                      <Skeleton width="min(28rem, 94%)" height="0.875rem" />
                      <Skeleton width="min(20rem, 78%)" height="0.8125rem" />
                    </div>
                  </div>

                  <div className="checkout-form-actions">
                    <Skeleton
                      width="16.5rem"
                      height="2.75rem"
                      radius="pill"
                      className="w-full sm:w-[16.5rem]"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <SiteOrderSummarySkeleton
            titleWidth="12rem"
            rowCount={3}
            ctaHeight="2.375rem"
            hasTotalsTopBorder
            itemsSlot={
              <div className="checkout-sidebar-items">
                {Array.from({ length: 2 }, (_, idx) => (
                  <div key={idx} className="site-skel-checkout-item">
                    <div className="site-skel-checkout-item-row">
                      <Skeleton width="min(11rem, 68%)" height="0.875rem" />
                      <Skeleton width="4.5rem" height="0.875rem" />
                    </div>
                    <Skeleton width="5.5rem" height="0.75rem" />
                  </div>
                ))}
              </div>
            }
          />
        </div>
      </div>
    </SiteSkeletonFrame>
  );
}
