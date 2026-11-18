import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/components/baking-class-card.css';
import '@/styles/components/product-card.css';
import { cn } from '@/utils';

interface SiteBakingClassCardSkeletonProps {
  className?: string;
}

/** Mirrors BakingClassCard landscape card with responsive 4:3 (mobile) / 3:4 (tablet+) thumbnail. */
export function SiteBakingClassCardSkeleton({
  className,
}: SiteBakingClassCardSkeletonProps) {
  return (
    <Card className={cn('baking-class-card', className)}>
      <div className="baking-class-card-media-col">
        <div className="site-skel-media-box site-skel-class-media">
          <Skeleton
            width="100%"
            height="100%"
            radius="md"
            className="site-skel-fill"
          />
        </div>
      </div>

      <div className="baking-class-card-main">
        <div className="product-badge-row" aria-hidden="true">
          <Skeleton width="5rem" height="1.625rem" radius="pill" />
          <Skeleton width="7.25rem" height="1.625rem" radius="pill" />
          <Skeleton width="5.5rem" height="1.625rem" radius="pill" />
        </div>

        <Skeleton width="min(15rem, 90%)" height="1.25rem" />

        <div className="site-skel-stack-xs">
          <Skeleton width="100%" height="0.875rem" />
          <Skeleton width="76%" height="0.875rem" />
        </div>

        <div className="baking-class-card-schedule-block">
          <div className="site-skel-inline-row">
            <Skeleton width="0.875rem" height="0.875rem" radius="sm" />
            <Skeleton width="12rem" height="0.875rem" />
          </div>
          <Skeleton width="10rem" height="0.8125rem" />
        </div>

        <div className="baking-class-card-footer">
          <Skeleton width="6.5rem" height="1.5rem" />
          <Skeleton width="7.5rem" height="2.375rem" radius="pill" />
        </div>
      </div>
    </Card>
  );
}
