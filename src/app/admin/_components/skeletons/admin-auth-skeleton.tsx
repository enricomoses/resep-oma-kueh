import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/layouts/admin-auth.css';
import { cn } from '@/utils';

import { AdminSkeletonFrame } from './admin-skeleton-frame';

interface AdminAuthSkeletonProps {
  className?: string;
}

/** Mirrors AdminLoginView / AdminResetPasswordView centered auth card. */
export function AdminAuthSkeleton({ className }: AdminAuthSkeletonProps) {
  return (
    <AdminSkeletonFrame className={cn('admin-auth-page', className)}>
      <div className="content-container admin-auth-container">
        <div className="admin-auth-top-link">
          <Skeleton width="9rem" height="2.25rem" radius="pill" />
        </div>

        <Card tone="surface" className="admin-auth-card">
          <div className="admin-auth-header">
            <Skeleton width="2.75rem" height="2.75rem" radius="circle" />
            <div className="admin-skel-header-copy">
              <Skeleton width="12rem" height="1.625rem" />
              <Skeleton width="18rem" height="0.9375rem" />
            </div>
          </div>

          <div className="admin-auth-form">
            <div className="admin-skel-field">
              <Skeleton width="5.5rem" height="0.8125rem" />
              <Skeleton width="100%" height="3rem" radius="md" />
            </div>
            <div className="admin-skel-field">
              <Skeleton width="6.5rem" height="0.8125rem" />
              <Skeleton width="100%" height="3rem" radius="md" />
            </div>

            <div className="admin-auth-actions">
              <Skeleton width="8.5rem" height="1rem" />
              <Skeleton width="8.5rem" height="2.75rem" radius="pill" />
            </div>
          </div>

          <div className="admin-auth-notice">
            <Skeleton width="100%" height="0.875rem" />
          </div>
        </Card>
      </div>
    </AdminSkeletonFrame>
  );
}
