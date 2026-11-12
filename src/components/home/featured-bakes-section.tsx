import { ArrowRight } from 'lucide-react';
import { MediaPlaceholder } from '@/app/_components';
import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { ROUTES } from '@/constants';
import { HOME_COPY, HOME_SECTION_IDS } from '@/constants/home.constant';
import { withBranch } from '@/utils/branch-url';
import { cn } from '@/utils';
import type { HomeFeaturedProduct, HomeSectionResult } from '@/types/home';

interface FeaturedBakesSectionProps {
  featuredProducts: HomeSectionResult<HomeFeaturedProduct[]>;
  branchCode: string | null;
  className?: string;
}
export function FeaturedBakesSection({
  featuredProducts,
  branchCode,
  className,
}: FeaturedBakesSectionProps) {
  return (
    <section
      id={HOME_SECTION_IDS.FEATURED}
      className={cn('home-section', className)}
      aria-labelledby="home-featured-title"
    >
      <div className="home-section-header">
        <div>
          <h2 id="home-featured-title" className="editorial-heading">
            {HOME_COPY.FEATURED_TITLE}
          </h2>
          <p className="home-section-subtitle">{HOME_COPY.FEATURED_SUBTITLE}</p>
        </div>
        <ActionLink
          href={withBranch(ROUTES.MENU, branchCode)}
          variant="secondary"
          prefetch={false}
        >
          {HOME_COPY.FEATURED_ALL_CTA}
        </ActionLink>
      </div>
      {featuredProducts.status === 'error' ? (
        <Feedback tone="error" title={HOME_COPY.FEATURED_ERROR} />
      ) : featuredProducts.data.length === 0 ? (
        <Feedback title={HOME_COPY.FEATURED_EMPTY} />
      ) : (
        <div className="product-grid home-featured-grid">
          {featuredProducts.data.map((product) => {
            const targetHref = product.primaryCategory
              ? `${ROUTES.MENU}?category=${encodeURIComponent(product.primaryCategory.slug)}`
              : ROUTES.MENU;
            return (
              <Card key={product.id} className="home-featured-card">
                <MediaPlaceholder
                  caption={product.imageAlt}
                  className="home-card-media"
                />
                <div className="home-badge-row">
                  <Badge tone="accent">{HOME_COPY.BADGE_FEATURED}</Badge>
                  {product.isBestSeller ? (
                    <Badge tone="success">{HOME_COPY.BADGE_BEST_SELLER}</Badge>
                  ) : null}
                  {product.isNew ? (
                    <Badge tone="neutral">{HOME_COPY.BADGE_NEW}</Badge>
                  ) : null}
                  {product.productType === 'bundle' ? (
                    <Badge tone="neutral">{HOME_COPY.BADGE_BUNDLE}</Badge>
                  ) : null}
                </div>
                <div className="home-featured-card-body">
                  {product.primaryCategory ? (
                    <p className="home-card-eyebrow">
                      {product.primaryCategory.name}
                    </p>
                  ) : null}
                  <h3>{product.name}</h3>
                  {(product.shortDescription ?? product.description) ? (
                    <p>{product.shortDescription ?? product.description}</p>
                  ) : null}
                  <p className="home-price-note">
                    {HOME_COPY.FEATURED_PRICE_NOTE}
                  </p>
                </div>
                <ActionLink
                  href={withBranch(targetHref, branchCode)}
                  variant="secondary"
                  prefetch={false}
                >
                  {HOME_COPY.FEATURED_CTA}
                  <ArrowRight size={16} aria-hidden="true" />
                </ActionLink>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
