import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/features/admin-product-editor.css';
import { cn } from '@/utils';

import { AdminSkeletonFrame } from './admin-skeleton-frame';

interface AdminProductEditorSkeletonProps {
  className?: string;
}

/** 1:1 layout skeleton matching AdminProductEditorView header, form cards, and sticky preview aside. */
export function AdminProductEditorSkeleton({
  className,
}: AdminProductEditorSkeletonProps) {
  return (
    <AdminSkeletonFrame className={cn('admin-section', className)}>
      <div className="admin-editor-header">
        <div className="admin-editor-header-main">
          <Skeleton width="10.5rem" height="1.75rem" radius="pill" />
          <div className="admin-editor-title-row">
            <Skeleton width="min(20rem, 75%)" height="1.875rem" />
            <Skeleton width="5.5rem" height="1rem" />
          </div>
          <Skeleton width="min(26rem, 90%)" height="0.875rem" />
        </div>
        <Skeleton width="11rem" height="2.375rem" radius="pill" />
      </div>

      <div className="admin-editor-layout">
        <div className="admin-editor-main">
          <Card tone="surface" className="admin-editor-item-card">
            <Skeleton width="11rem" height="1.125rem" />
            <div className="admin-editor-form-group">
              <Skeleton width="8.5rem" height="0.75rem" />
              <div className="admin-form-row-2">
                <div className="admin-skel-field">
                  <Skeleton width="6rem" height="0.8125rem" />
                  <Skeleton width="100%" height="3rem" radius="md" />
                </div>
                <div className="admin-skel-field">
                  <Skeleton width="5rem" height="0.8125rem" />
                  <Skeleton width="100%" height="3rem" radius="md" />
                </div>
              </div>
              <div className="admin-form-row-3">
                <Skeleton width="100%" height="3rem" radius="md" />
                <Skeleton width="100%" height="3rem" radius="md" />
                <Skeleton width="100%" height="3rem" radius="md" />
              </div>
            </div>
            <div className="admin-editor-form-group">
              <Skeleton width="9.5rem" height="0.75rem" />
              <Skeleton width="100%" height="3rem" radius="md" />
              <Skeleton width="100%" height="5.5rem" radius="md" />
            </div>
          </Card>

          <Card tone="surface" className="admin-editor-item-card">
            <Skeleton width="9rem" height="1.125rem" />
            <div className="admin-category-assignment-grid">
              {Array.from({ length: 4 }, (_, idx) => (
                <div key={idx} className="admin-category-assignment-row">
                  <Skeleton width="11rem" height="1rem" />
                  <Skeleton width="4rem" height="1rem" />
                </div>
              ))}
            </div>
          </Card>

          <Card tone="surface" className="admin-editor-item-card">
            <div className="admin-editor-item-header">
              <Skeleton width="10.5rem" height="1.125rem" />
              <Skeleton width="8rem" height="2.25rem" radius="pill" />
            </div>
            <div className="admin-editor-subgroup">
              <div className="admin-form-row-2">
                <Skeleton width="100%" height="2.75rem" radius="md" />
                <Skeleton width="100%" height="2.75rem" radius="md" />
              </div>
            </div>
          </Card>

          <Card tone="surface" className="admin-editor-savebar">
            <div className="admin-inline-actions">
              <Skeleton width="12rem" height="2.5rem" radius="pill" />
              <Skeleton width="12.5rem" height="2.5rem" radius="pill" />
            </div>
          </Card>
        </div>

        <aside className="admin-editor-preview-aside" aria-hidden="true">
          <Card tone="surface" className="admin-editor-preview-card">
            <Skeleton width="11.5rem" height="1.125rem" />
            <div className="admin-skel-product-preview">
              <Skeleton width="100%" height="11rem" radius="md" />
              <Skeleton width="5rem" height="0.75rem" />
              <Skeleton width="11rem" height="1.125rem" />
              <Skeleton width="100%" height="0.875rem" />
              <Skeleton width="7rem" height="1.125rem" />
              <Skeleton width="100%" height="2.5rem" radius="pill" />
            </div>
          </Card>
        </aside>
      </div>
    </AdminSkeletonFrame>
  );
}
