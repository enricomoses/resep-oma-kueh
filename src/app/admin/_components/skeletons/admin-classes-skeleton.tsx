import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/features/admin-classes.css';
import { cn } from '@/utils';

import { AdminSectionHeaderSkeleton } from './admin-section-header-skeleton';
import { AdminSkeletonFrame } from './admin-skeleton-frame';

interface AdminClassesSkeletonProps {
  className?: string;
}

/** 1:1 layout skeleton matching AdminClassesView programs panel and branch sessions panel. */
export function AdminClassesSkeleton({ className }: AdminClassesSkeletonProps) {
  return (
    <AdminSkeletonFrame
      className={cn('admin-section admin-classes-section', className)}
    >
      <AdminSectionHeaderSkeleton buttonCount={3} />

      <Card tone="surface" className="admin-classes-panel">
        <AdminSectionHeaderSkeleton buttonCount={1} />

        <ul className="admin-classes-list">
          {Array.from({ length: 2 }, (_, idx) => (
            <li key={idx} className="admin-classes-row">
              <div className="admin-classes-row-main">
                <div className="admin-classes-row-head">
                  <Skeleton width="13rem" height="1rem" />
                  <Skeleton width="4.5rem" height="0.8125rem" />
                </div>
                <Skeleton width="min(22rem, 85%)" height="0.8125rem" />
                <div className="admin-classes-row-flags">
                  <Skeleton width="8.5rem" height="0.75rem" />
                  <Skeleton width="7.5rem" height="0.75rem" />
                </div>
              </div>

              <div className="admin-classes-row-actions">
                <Skeleton width="4.25rem" height="2rem" radius="pill" />
                <Skeleton width="5.25rem" height="2rem" radius="pill" />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card tone="surface" className="admin-classes-panel">
        <AdminSectionHeaderSkeleton buttonCount={1} />

        <div className="admin-form-grid-2">
          <div className="admin-skel-field">
            <Skeleton width="5.5rem" height="0.8125rem" />
            <Skeleton width="100%" height="2.5rem" radius="md" />
          </div>
          <div className="admin-skel-field">
            <Skeleton width="8rem" height="0.8125rem" />
            <Skeleton width="100%" height="2.5rem" radius="md" />
          </div>
        </div>

        <ul className="admin-classes-list">
          {Array.from({ length: 3 }, (_, idx) => (
            <li key={idx} className="admin-classes-row">
              <div className="admin-classes-row-main">
                <div className="admin-classes-row-head">
                  <Skeleton width="12rem" height="1rem" />
                  <Skeleton width="4.5rem" height="1.25rem" radius="pill" />
                  <Skeleton width="4.5rem" height="0.8125rem" />
                  <Skeleton width="7rem" height="0.8125rem" />
                </div>
                <Skeleton width="min(20rem, 85%)" height="0.8125rem" />
                <Skeleton width="min(24rem, 90%)" height="0.8125rem" />
              </div>

              <div className="admin-classes-row-actions">
                <Skeleton width="4.25rem" height="2rem" radius="pill" />
                <Skeleton width="6.5rem" height="2rem" radius="pill" />
                <Skeleton width="6.5rem" height="2rem" radius="pill" />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </AdminSkeletonFrame>
  );
}
