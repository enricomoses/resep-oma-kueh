import type { ReactNode } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/layouts/admin-workspace.css';
import '@/styles/features/admin-shared.css';
import { cn } from '@/utils';

import { AdminSkeletonFrame } from './admin-skeleton-frame';

interface AdminWorkspaceSkeletonProps {
  children: ReactNode;
  className?: string;
}

/** Mirrors AdminShell (fixed sidebar on desktop, topbar, and main content slot). */
export function AdminWorkspaceSkeleton({
  children,
  className,
}: AdminWorkspaceSkeletonProps) {
  return (
    <AdminSkeletonFrame className={cn('admin-workspace', className)}>
      <aside className="admin-sidebar" aria-hidden="true">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand">
            <Skeleton width="2.375rem" height="2.375rem" radius="md" />
            <div className="admin-sidebar-brand-text admin-skel-stack-sm">
              <Skeleton width="7.5rem" height="0.875rem" />
              <Skeleton width="5.5rem" height="0.6875rem" />
            </div>
          </div>
          <Skeleton width="2rem" height="2rem" radius="sm" />
        </div>

        <div className="admin-sidebar-nav-scroll">
          <div className="admin-sidebar-section-label">
            <Skeleton width="5.5rem" height="0.6875rem" />
          </div>
          <div className="admin-nav-list">
            {Array.from({ length: 10 }, (_, idx) => (
              <div key={idx} className="admin-skel-nav-item">
                <Skeleton width="1.125rem" height="1.125rem" radius="sm" />
                <Skeleton
                  width={idx % 2 === 0 ? '8.5rem' : '7rem'}
                  height="0.875rem"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="admin-sidebar-footer">
          <div className="admin-skel-profile">
            <Skeleton width="8rem" height="0.875rem" />
            <Skeleton width="10.5rem" height="0.75rem" />
            <Skeleton width="6.5rem" height="1.25rem" radius="pill" />
          </div>
        </div>
      </aside>

      <div className="admin-workspace-body">
        <header className="admin-topbar" aria-hidden="true">
          <div className="admin-topbar-left">
            <Skeleton
              width="5rem"
              height="2.25rem"
              radius="pill"
              className="admin-mobile-menu-btn"
            />
            <div className="admin-topbar-title-wrap admin-skel-stack-sm">
              <Skeleton width="11rem" height="1.125rem" />
              <Skeleton width="15rem" height="0.75rem" />
            </div>
          </div>

          <div className="admin-shell-header-actions">
            <Skeleton width="7.5rem" height="2.25rem" radius="pill" />
            <Skeleton width="5.75rem" height="2.25rem" radius="pill" />
          </div>
        </header>

        <main className="admin-shell-main">{children}</main>
      </div>
    </AdminSkeletonFrame>
  );
}
