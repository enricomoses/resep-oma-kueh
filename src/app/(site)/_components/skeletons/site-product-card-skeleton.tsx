import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/components/product-card.css';
import { cn } from '@/utils';

interface SiteProductCardSkeletonProps {
  variant?: 'catalog' | 'featured';
  className?: string;
}

/** Mirrors MenuProductCard and FeaturedBakesSection product cards across grid breakpoints. */
export function SiteProductCardSkeleton({
  variant = 'catalog',
  className,
}: SiteProductCardSkeletonProps) {
  const isFeatured = variant === 'featured';

  return (
    <Card
      className={cn(
        isFeatured ? 'home-featured-card' : 'menu-product-card',
        className,
      )}
    >
      <div className="site-skel-media-box site-skel-card-media">
        <Skeleton
          width="100%"
          height="100%"
          radius="md"
          className="site-skel-fill"
        />
      </div>

      <div className="product-badge-row" aria-hidden="true">
        <Skeleton width="5.25rem" height="1.625rem" radius="pill" />
        <Skeleton width="4.5rem" height="1.625rem" radius="pill" />
      </div>

      <div
        className={cn(
          isFeatured ? 'home-featured-card-body' : 'menu-product-card-body',
        )}
      >
        <Skeleton width="5.5rem" height="0.8125rem" />
        <div className="site-skel-stack-xs">
          <Skeleton width="88%" height="1.1875rem" />
          <Skeleton width="64%" height="1.1875rem" />
        </div>
        <div className="site-skel-stack-xs">
          <Skeleton width="100%" height="0.875rem" />
          <Skeleton width="78%" height="0.875rem" />
        </div>

        {isFeatured ? (
          <div className="menu-product-price-block">
            <Skeleton width="8.5rem" height="1.375rem" />
          </div>
        ) : (
          <div className="menu-product-card-pricing">
            <Skeleton width="6rem" height="0.8125rem" />
            <div className="menu-product-price-block">
              <Skeleton width="8.5rem" height="1.375rem" />
            </div>
          </div>
        )}
      </div>

      <div className={cn(!isFeatured && 'menu-product-card-actions')}>
        <Skeleton width="100%" height="2.75rem" radius="pill" />
      </div>
    </Card>
  );
}
