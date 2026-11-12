import { ArrowRight } from 'lucide-react';
import { ActionLink } from '@/components/ui/action-link';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { ROUTES } from '@/constants';
import { HOME_COPY, HOME_SECTION_IDS } from '@/constants/home.constant';
import { withBranch } from '@/utils/branch-url';
import { cn } from '@/utils';
import type { HomeCategory, HomeSectionResult } from '@/types/home';

interface ShopBySeriesSectionProps {
  categories: HomeSectionResult<HomeCategory[]>;
  branchCode: string | null;
  className?: string;
}
export function ShopBySeriesSection({
  categories,
  branchCode,
  className,
}: ShopBySeriesSectionProps) {
  return (
    <section
      id={HOME_SECTION_IDS.SERIES}
      className={cn('home-section', className)}
      aria-labelledby="home-series-title"
    >
      <div className="home-section-header">
        <div>
          <h2 id="home-series-title" className="editorial-heading">
            {HOME_COPY.SERIES_TITLE}
          </h2>
          <p className="home-section-subtitle">{HOME_COPY.SERIES_SUBTITLE}</p>
        </div>
        <ActionLink
          href={withBranch(ROUTES.MENU, branchCode)}
          variant="secondary"
          prefetch={false}
        >
          {HOME_COPY.SERIES_ALL_CTA}
        </ActionLink>
      </div>
      {categories.status === 'error' ? (
        <Feedback tone="error" title={HOME_COPY.SERIES_ERROR} />
      ) : categories.data.length === 0 ? (
        <Feedback title={HOME_COPY.SERIES_EMPTY} />
      ) : (
        <div className="home-series-grid">
          {categories.data.map((category) => (
            <Card key={category.id} className="home-series-card">
              <div className="home-series-card-body">
                <h3>{category.name}</h3>
                {category.description ? <p>{category.description}</p> : null}
              </div>
              <ActionLink
                href={withBranch(
                  `${ROUTES.MENU}?category=${encodeURIComponent(category.slug)}`,
                  branchCode,
                )}
                prefetch={false}
              >
                {HOME_COPY.SERIES_CTA}
                <ArrowRight size={16} aria-hidden="true" />
              </ActionLink>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
