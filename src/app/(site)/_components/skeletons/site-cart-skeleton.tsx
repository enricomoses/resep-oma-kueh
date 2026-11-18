import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BOUNDARY_COPY } from '@/constants/seo.constant';
import '@/styles/features/cart.css';
import { cn } from '@/utils';

import { SiteOrderSummarySkeleton } from './site-order-summary-skeleton';
import { SitePageHeaderSkeleton } from './site-page-header-skeleton';
import { SiteSkeletonFrame } from './site-skeleton-frame';

interface SiteCartSkeletonProps {
  label?: string;
  className?: string;
}

/** 1:1 layout skeleton matching CartView header, line items, and sticky summary aside. */
export function SiteCartSkeleton({
  label = BOUNDARY_COPY.LOADING_LABEL,
  className,
}: SiteCartSkeletonProps) {
  return (
    <SiteSkeletonFrame label={label} className={cn('cart-page', className)}>
      <div className="cart-container" aria-hidden="true">
        <div className="cart-header-nav">
          <Skeleton width="8.5rem" height="1rem" />
        </div>

        <SitePageHeaderSkeleton
          className="cart-header"
          compactTitle
          subtitleLines={1}
          hasAside
        />

        <div className="cart-main-grid">
          <section className="cart-items-section">
            <div className="cart-items-toolbar">
              <Skeleton width="8.5rem" height="0.875rem" />
              <Skeleton width="9rem" height="2.25rem" radius="pill" />
            </div>

            <div className="cart-items-list">
              {Array.from({ length: 2 }, (_, idx) => (
                <Card key={idx} className="cart-item-card">
                  <div className="cart-item-grid">
                    <div className="cart-item-thumbnail-wrap">
                      <div className="site-skel-media-box site-skel-cart-thumb">
                        <Skeleton
                          width="100%"
                          height="100%"
                          radius="md"
                          className="site-skel-fill"
                        />
                      </div>
                    </div>

                    <div className="cart-item-details">
                      <div className="cart-item-header">
                        <div className="cart-item-heading w-full">
                          <Skeleton width="min(13rem, 78%)" height="1.125rem" />
                          <Skeleton width="6.5rem" height="0.8125rem" />
                        </div>
                        <Skeleton
                          width="4.75rem"
                          height="2.25rem"
                          radius="pill"
                        />
                      </div>

                      <div className="cart-item-footer">
                        <Skeleton width="7.5rem" height="0.9375rem" />
                        <div className="cart-item-controls">
                          <Skeleton
                            width="8.5rem"
                            height="2.5rem"
                            radius="pill"
                          />
                          <Skeleton width="6.25rem" height="1.0625rem" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="cart-items-footer">
              <Skeleton width="11.5rem" height="2.375rem" radius="pill" />
            </div>
          </section>

          <SiteOrderSummarySkeleton
            titleWidth="9.5rem"
            rowCount={2}
            ctaHeight="3.25rem"
          />
        </div>
      </div>
    </SiteSkeletonFrame>
  );
}
