import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/features/admin-promotions.css';
import { cn } from '@/utils';

import { AdminSectionHeaderSkeleton } from './admin-section-header-skeleton';
import { AdminSkeletonFrame } from './admin-skeleton-frame';

interface AdminPromotionsSkeletonProps {
  className?: string;
}

/** 1:1 layout skeleton matching AdminPromotionsView shipping banner card and directory panel. */
export function AdminPromotionsSkeleton({
  className,
}: AdminPromotionsSkeletonProps) {
  return (
    <AdminSkeletonFrame
      className={cn('admin-section admin-promo-section', className)}
    >
      <AdminSectionHeaderSkeleton buttonCount={2} />

      <Card tone="surface" className="admin-promo-card">
        <div className="admin-promo-card-head">
          <div className="admin-skel-header-copy">
            <Skeleton width="16rem" height="1.125rem" />
            <Skeleton width="min(28rem, 90%)" height="0.8125rem" />
          </div>
          <Skeleton width="8rem" height="0.875rem" />
        </div>

        <div className="admin-promo-grid-2">
          <div className="admin-skel-field">
            <Skeleton width="6.5rem" height="0.8125rem" />
            <Skeleton width="100%" height="2.5rem" radius="md" />
          </div>
          <div className="admin-skel-field">
            <Skeleton width="6rem" height="0.8125rem" />
            <Skeleton width="100%" height="2.5rem" radius="md" />
          </div>
        </div>

        <div className="admin-skel-field">
          <Skeleton width="7.5rem" height="0.8125rem" />
          <Skeleton width="100%" height="4.25rem" radius="md" />
        </div>

        <div className="admin-promo-card-footer">
          <Skeleton width="13rem" height="0.8125rem" />
          <Skeleton width="9.5rem" height="2.25rem" radius="pill" />
        </div>
      </Card>

      <Card tone="surface" className="admin-promo-panel">
        <ul className="admin-promo-list">
          {Array.from({ length: 3 }, (_, idx) => (
            <li key={idx} className="admin-promo-row">
              <div className="admin-promo-row-head">
                <div className="admin-promo-row-identity">
                  <div className="admin-promo-row-title-line">
                    <Skeleton width="13rem" height="1.0625rem" />
                    <Skeleton width="6.5rem" height="0.8125rem" />
                  </div>
                  <Skeleton width="min(20rem, 85%)" height="0.8125rem" />
                </div>

                <div className="admin-inline-actions">
                  <Skeleton width="4.5rem" height="2rem" radius="pill" />
                  <Skeleton width="5.25rem" height="2rem" radius="pill" />
                </div>
              </div>

              <div className="admin-promo-specs">
                {Array.from({ length: 4 }, (_, specIdx) => (
                  <div key={specIdx} className="admin-promo-spec-item">
                    <Skeleton width="5.5rem" height="0.75rem" />
                    <Skeleton width="7.5rem" height="0.9375rem" />
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </AdminSkeletonFrame>
  );
}
