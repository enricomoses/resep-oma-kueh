import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/features/admin-products.css';
import { cn } from '@/utils';

import { AdminSectionHeaderSkeleton } from './admin-section-header-skeleton';
import { AdminSkeletonFrame } from './admin-skeleton-frame';

interface AdminProductsSkeletonProps {
  className?: string;
}

/** 1:1 layout skeleton matching AdminProductsView filter bar, aligned directory, and pagination. */
export function AdminProductsSkeleton({
  className,
}: AdminProductsSkeletonProps) {
  return (
    <AdminSkeletonFrame
      className={cn('admin-section admin-prod-section', className)}
    >
      <AdminSectionHeaderSkeleton buttonCount={3} />

      <Card tone="surface" className="admin-prod-filter-card">
        <div className="admin-prod-filter-grid">
          <div className="admin-skel-field">
            <Skeleton width="5.5rem" height="0.8125rem" />
            <Skeleton width="100%" height="2.5rem" radius="md" />
          </div>
          <div className="admin-skel-field">
            <Skeleton width="3.5rem" height="0.8125rem" />
            <Skeleton width="100%" height="2.5rem" radius="md" />
          </div>
          <div className="admin-skel-field">
            <Skeleton width="4.5rem" height="0.8125rem" />
            <Skeleton width="100%" height="2.5rem" radius="md" />
          </div>
        </div>
      </Card>

      <Card tone="surface" className="admin-prod-panel">
        <div className="admin-prod-list-head" aria-hidden="true">
          <Skeleton width="4rem" height="0.75rem" />
          <Skeleton width="2.5rem" height="0.75rem" />
          <Skeleton width="3.5rem" height="0.75rem" />
          <Skeleton width="6.5rem" height="0.75rem" />
          <Skeleton width="2.5rem" height="0.75rem" className="ml-auto" />
        </div>

        <ul className="admin-prod-list">
          {Array.from({ length: 5 }, (_, idx) => (
            <li key={idx} className="admin-prod-row">
              <div className="admin-prod-primary">
                <div className="admin-prod-name-line">
                  <Skeleton width="11rem" height="1rem" />
                  <Skeleton width="8.5rem" height="1.25rem" radius="sm" />
                </div>
                <Skeleton width="7.5rem" height="0.8125rem" />
              </div>

              <div className="admin-prod-meta-inline">
                <Skeleton width="7.5rem" height="0.875rem" />
                <div className="admin-skel-inline-row">
                  <Skeleton width="0.5rem" height="0.5rem" radius="circle" />
                  <Skeleton width="4.5rem" height="0.8125rem" />
                </div>
                <Skeleton width="6rem" height="0.8125rem" />
              </div>

              <div className="admin-prod-actions">
                <Skeleton width="7.75rem" height="2rem" radius="pill" />
                <Skeleton width="5.5rem" height="2rem" radius="pill" />
                <Skeleton width="5.25rem" height="2rem" radius="pill" />
              </div>
            </li>
          ))}
        </ul>

        <div className="admin-prod-pagination">
          <Skeleton width="13rem" height="0.875rem" />
          <div className="admin-inline-actions">
            <Skeleton width="6rem" height="2.25rem" radius="pill" />
            <Skeleton width="5.5rem" height="2.25rem" radius="pill" />
          </div>
        </div>
      </Card>
    </AdminSkeletonFrame>
  );
}
