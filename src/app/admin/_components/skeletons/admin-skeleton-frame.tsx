import type { ReactNode } from 'react';

import { BOUNDARY_COPY } from '@/constants/seo.constant';
import '@/styles/features/admin-skeleton.css';
import { cn } from '@/utils';

interface AdminSkeletonFrameProps {
  children: ReactNode;
  className?: string;
}

/** Accessible status container wrapping admin skeleton screens. */
export function AdminSkeletonFrame({
  children,
  className,
}: AdminSkeletonFrameProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={BOUNDARY_COPY.ADMIN_LOADING_LABEL}
      className={cn(className)}
    >
      <span className="admin-sr-only">{BOUNDARY_COPY.ADMIN_LOADING_LABEL}</span>
      {children}
    </div>
  );
}
