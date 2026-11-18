import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/components/page-sections.css';
import '@/styles/components/product-card.css';
import '@/styles/features/menu.css';
import { cn } from '@/utils';

import { SitePageHeaderSkeleton } from './site-page-header-skeleton';
import { SiteProductCardSkeleton } from './site-product-card-skeleton';
import { SiteSkeletonFrame } from './site-skeleton-frame';

interface SiteMenuResultsSkeletonProps {
  cardCount?: number;
  className?: string;
}

/** Skeleton for MenuResultsSection (result summary, 3-col desktop product grid, pagination). */
export function SiteMenuResultsSkeleton({
  cardCount = 6,
  className,
}: SiteMenuResultsSkeletonProps) {
  return (
    <div className={cn('menu-results-column', className)} aria-hidden="true">
      <div className="menu-results-header">
        <Skeleton width="12.5rem" height="0.9375rem" />
      </div>

      <div className="product-grid menu-product-grid">
        {Array.from({ length: cardCount }, (_, idx) => (
          <SiteProductCardSkeleton key={idx} variant="catalog" />
        ))}
      </div>

      <div className="menu-pagination">
        <Skeleton width="7.25rem" height="2.75rem" radius="pill" />
        <Skeleton width="7.5rem" height="0.9375rem" />
        <Skeleton width="7.25rem" height="2.75rem" radius="pill" />
      </div>
    </div>
  );
}

interface SiteMenuSkeletonProps {
  className?: string;
}

/** 1:1 layout skeleton matching MenuView header, sticky filter sidebar/mobile toolbar, and product grid. */
export function SiteMenuSkeleton({ className }: SiteMenuSkeletonProps) {
  return (
    <SiteSkeletonFrame
      className={cn('content-container menu-page-main', className)}
    >
      <section className="menu-header-section" aria-hidden="true">
        <SitePageHeaderSkeleton subtitleLines={2} />

        <Card tone="cream" className="menu-branch-notice-card">
          <Skeleton width="min(16rem, 78%)" height="1.125rem" />
          <Skeleton width="min(32rem, 96%)" height="0.9375rem" />
        </Card>
      </section>

      <section className="menu-catalog-section" aria-hidden="true">
        <div className="menu-toolbar-mobile">
          <Skeleton width="10.5rem" height="2.75rem" radius="pill" />
          <Skeleton width="8.5rem" height="0.9375rem" />
        </div>

        <div className="menu-layout-grid">
          <aside className="menu-sidebar-desktop">
            <Card className="menu-filter-card">
              <Skeleton width="6.5rem" height="1.25rem" />

              <div className="menu-filter-panel">
                {['4.5rem', '5rem', '5.5rem', '6.5rem'].map((w, idx) => (
                  <div key={idx} className="site-skel-field">
                    <Skeleton width={w} height="0.875rem" />
                    <Skeleton width="100%" height="3rem" radius="md" />
                  </div>
                ))}

                <div className="menu-price-filter-group">
                  <div className="site-skel-field">
                    <Skeleton width="6rem" height="0.875rem" />
                    <Skeleton width="100%" height="3rem" radius="md" />
                  </div>
                  <div className="site-skel-field">
                    <Skeleton width="6.5rem" height="0.875rem" />
                    <Skeleton width="100%" height="3rem" radius="md" />
                  </div>
                  <Skeleton width="100%" height="2.75rem" radius="pill" />
                </div>

                <div className="menu-sort-reset-group">
                  <div className="site-skel-field">
                    <Skeleton width="4.5rem" height="0.875rem" />
                    <Skeleton width="100%" height="3rem" radius="md" />
                  </div>
                  <Skeleton width="100%" height="2.75rem" radius="pill" />
                </div>
              </div>
            </Card>
          </aside>

          <SiteMenuResultsSkeleton />
        </div>
      </section>
    </SiteSkeletonFrame>
  );
}
