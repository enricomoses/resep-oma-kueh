import '@/styles/features/classes.css';
import { cn } from '@/utils';

import { SiteBakingClassCardSkeleton } from './site-baking-class-card-skeleton';
import { SitePageHeaderSkeleton } from './site-page-header-skeleton';
import { SiteSkeletonFrame } from './site-skeleton-frame';

interface SiteClassesGridSkeletonProps {
  cardCount?: number;
  className?: string;
}

/** Reusable 2-column responsive skeleton grid for baking class cards. */
export function SiteClassesGridSkeleton({
  cardCount = 4,
  className,
}: SiteClassesGridSkeletonProps) {
  return (
    <div className={cn('baking-class-grid', className)} aria-hidden="true">
      {Array.from({ length: cardCount }, (_, idx) => (
        <SiteBakingClassCardSkeleton key={idx} />
      ))}
    </div>
  );
}

interface SiteClassesSkeletonProps {
  className?: string;
}

/** 1:1 layout skeleton matching ClassesView hero header, branch badge, and 2-column class directory. */
export function SiteClassesSkeleton({ className }: SiteClassesSkeletonProps) {
  return (
    <SiteSkeletonFrame
      className={cn('content-container classes-main', className)}
    >
      <div aria-hidden="true">
        <SitePageHeaderSkeleton
          className="classes-hero-header"
          compactTitle
          subtitleLines={2}
          hasBadge
        />
      </div>

      <SiteClassesGridSkeleton />
    </SiteSkeletonFrame>
  );
}
