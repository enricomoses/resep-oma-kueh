import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/features/admin-cms.css';
import { cn } from '@/utils';

import { AdminSectionHeaderSkeleton } from './admin-section-header-skeleton';
import { AdminSkeletonFrame } from './admin-skeleton-frame';

interface AdminContentSkeletonProps {
  className?: string;
}

/** 1:1 layout skeleton matching AdminContentView two-column key list and entry editor. */
export function AdminContentSkeleton({ className }: AdminContentSkeletonProps) {
  return (
    <AdminSkeletonFrame
      className={cn('admin-section admin-cms-section', className)}
    >
      <AdminSectionHeaderSkeleton buttonCount={1} />

      <div className="admin-cms-layout">
        <Card tone="surface" className="admin-cms-nav-card">
          <div className="admin-cms-nav-head">
            <Skeleton width="12rem" height="0.75rem" />
          </div>
          <ul className="admin-cms-key-list">
            {Array.from({ length: 8 }, (_, idx) => (
              <li key={idx} className="admin-cms-key-item">
                <div className="admin-cms-key-btn">
                  <div className="admin-cms-key-meta">
                    <Skeleton width="8.5rem" height="0.875rem" />
                    <Skeleton width="6.5rem" height="0.75rem" />
                  </div>
                  <Skeleton width="5rem" height="0.8125rem" />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card tone="surface" className="admin-cms-editor-card">
          <div className="admin-cms-editor-stack">
            <div className="admin-cms-editor-head">
              <div className="admin-skel-header-copy">
                <Skeleton width="11rem" height="1.125rem" />
                <Skeleton width="16rem" height="0.8125rem" />
              </div>
              <Skeleton width="5.5rem" height="0.875rem" />
            </div>

            <div className="admin-skel-stack-md">
              <div className="admin-skel-field">
                <Skeleton width="6rem" height="0.8125rem" />
                <Skeleton width="100%" height="3rem" radius="md" />
              </div>
              <div className="admin-skel-field">
                <Skeleton width="7.5rem" height="0.8125rem" />
                <Skeleton width="100%" height="5.5rem" radius="md" />
              </div>
              <div className="admin-skel-field">
                <Skeleton width="6.5rem" height="0.8125rem" />
                <Skeleton width="100%" height="3rem" radius="md" />
              </div>
            </div>

            <div className="admin-cms-editor-footer">
              <Skeleton width="7.5rem" height="2.25rem" radius="pill" />
              <Skeleton width="8rem" height="2.25rem" radius="pill" />
            </div>
          </div>
        </Card>
      </div>
    </AdminSkeletonFrame>
  );
}
