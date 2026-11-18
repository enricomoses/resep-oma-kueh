import type { ReactNode } from 'react';

import { BOUNDARY_COPY } from '@/constants/seo.constant';
import { SITE_COPY } from '@/constants/site.constant';
import '@/styles/features/site-skeleton.css';
import { cn } from '@/utils';

interface SiteSkeletonFrameProps {
  children: ReactNode;
  label?: string;
  className?: string;
}

/** Accessible `<main>` landmark container wrapping public site skeleton screens. */
export function SiteSkeletonFrame({
  children,
  label = BOUNDARY_COPY.LOADING_LABEL,
  className,
}: SiteSkeletonFrameProps) {
  return (
    <main
      id={SITE_COPY.MAIN_ID}
      tabIndex={-1}
      aria-busy="true"
      className={cn(className)}
    >
      {children}
      <div role="status" aria-live="polite" className="sr-only">
        {label}
      </div>
    </main>
  );
}
