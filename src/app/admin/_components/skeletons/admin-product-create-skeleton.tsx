import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/features/admin-product-editor.css';
import { cn } from '@/utils';

import { AdminSectionHeaderSkeleton } from './admin-section-header-skeleton';
import { AdminSkeletonFrame } from './admin-skeleton-frame';

interface AdminProductCreateSkeletonProps {
  className?: string;
}

/** 1:1 layout skeleton matching AdminProductCreateView sectioned draft creation form. */
export function AdminProductCreateSkeleton({
  className,
}: AdminProductCreateSkeletonProps) {
  return (
    <AdminSkeletonFrame className={cn('admin-section', className)}>
      <AdminSectionHeaderSkeleton buttonCount={0} hasBackLink />

      <Card tone="surface" className="admin-editor-create-card">
        <div className="admin-form">
          <div className="admin-editor-form-group">
            <Skeleton width="8.5rem" height="0.75rem" />
            <div className="admin-form-row-2">
              <div className="admin-skel-field">
                <Skeleton width="6.5rem" height="0.8125rem" />
                <Skeleton width="100%" height="3rem" radius="md" />
              </div>
              <div className="admin-skel-field">
                <Skeleton width="5rem" height="0.8125rem" />
                <Skeleton width="100%" height="3rem" radius="md" />
              </div>
            </div>
            <div className="admin-form-row-2">
              <div className="admin-skel-field">
                <Skeleton width="6rem" height="0.8125rem" />
                <Skeleton width="100%" height="3rem" radius="md" />
              </div>
              <div className="admin-skel-field">
                <Skeleton width="6.5rem" height="0.8125rem" />
                <Skeleton width="100%" height="3rem" radius="md" />
              </div>
            </div>
          </div>

          <div className="admin-editor-form-group">
            <Skeleton width="10rem" height="0.75rem" />
            <div className="admin-skel-field">
              <Skeleton width="7.5rem" height="0.8125rem" />
              <Skeleton width="100%" height="3rem" radius="md" />
            </div>
            <div className="admin-skel-field">
              <Skeleton width="8.5rem" height="0.8125rem" />
              <Skeleton width="100%" height="5.5rem" radius="md" />
            </div>
          </div>

          <div className="admin-editor-form-group">
            <Skeleton width="8rem" height="0.75rem" />
            <div className="admin-editor-checkbox-panel">
              <Skeleton width="14rem" height="1rem" />
              <Skeleton width="11rem" height="1rem" />
              <Skeleton width="12rem" height="1rem" />
            </div>
          </div>

          <div className="admin-editor-form-footer">
            <Skeleton width="4.5rem" height="2.25rem" radius="pill" />
            <Skeleton width="15rem" height="2.75rem" radius="pill" />
          </div>
        </div>
      </Card>
    </AdminSkeletonFrame>
  );
}
