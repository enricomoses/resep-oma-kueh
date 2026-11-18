import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/features/admin-categories.css';
import { cn } from '@/utils';

import { AdminSectionHeaderSkeleton } from './admin-section-header-skeleton';
import { AdminSkeletonFrame } from './admin-skeleton-frame';

interface AdminCategoriesSkeletonProps {
  className?: string;
}

/** 1:1 layout skeleton matching AdminCategoriesView toolbar and unified directory list. */
export function AdminCategoriesSkeleton({
  className,
}: AdminCategoriesSkeletonProps) {
  return (
    <AdminSkeletonFrame
      className={cn('admin-section admin-cat-section', className)}
    >
      <AdminSectionHeaderSkeleton buttonCount={2} />

      <div className="admin-cat-toolbar">
        <div className="admin-cat-tabs">
          {['5.5rem', '7.5rem', '5rem', '6.5rem'].map((w, idx) => (
            <Skeleton key={idx} width={w} height="2.375rem" radius="sm" />
          ))}
        </div>
        <div className="admin-cat-search-wrap">
          <Skeleton width="100%" height="2.375rem" radius="md" />
        </div>
      </div>

      <Card tone="surface" className="admin-cat-panel">
        <div className="admin-cat-list-head" aria-hidden="true">
          <Skeleton width="4.5rem" height="0.75rem" />
          <Skeleton width="3.5rem" height="0.75rem" />
          <Skeleton width="3.5rem" height="0.75rem" />
          <Skeleton width="4.5rem" height="0.75rem" />
          <Skeleton width="2.5rem" height="0.75rem" className="ml-auto" />
        </div>

        <ul className="admin-cat-list">
          {Array.from({ length: 5 }, (_, idx) => (
            <li key={idx} className="admin-cat-row">
              <div className="admin-cat-primary">
                <div className="admin-cat-name-line">
                  <Skeleton width="10rem" height="1rem" />
                  <Skeleton width="6.5rem" height="1.25rem" radius="sm" />
                </div>
                <Skeleton width="min(22rem, 85%)" height="0.8125rem" />
              </div>

              <div className="admin-cat-meta-inline">
                <div className="admin-skel-inline-row">
                  <Skeleton width="0.5rem" height="0.5rem" radius="circle" />
                  <Skeleton width="5.25rem" height="0.8125rem" />
                </div>
                <Skeleton width="2rem" height="0.875rem" />
                <Skeleton width="7.5rem" height="0.8125rem" />
              </div>

              <div className="admin-cat-actions">
                <Skeleton width="4.5rem" height="2rem" radius="pill" />
                <Skeleton width="5.25rem" height="2rem" radius="pill" />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </AdminSkeletonFrame>
  );
}
