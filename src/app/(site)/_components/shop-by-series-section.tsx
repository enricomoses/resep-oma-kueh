import { ArrowRight } from 'lucide-react';

import { SectionHeader } from '@/components/common/layout/section-header';
import { ActionLink } from '@/components/ui/action-link';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { ROUTES } from '@/constants';
import { HOME_COPY, HOME_SECTION_IDS } from '@/constants/home.constant';
import type { HomeCategory, HomeSectionResult } from '@/types/home';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';

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
      <SectionHeader
        titleId="home-series-title"
        title={HOME_COPY.SERIES_TITLE}
        subtitle={HOME_COPY.SERIES_SUBTITLE}
        actions={
          <ActionLink
            href={withBranch(ROUTES.MENU, branchCode)}
            variant="secondary"
            prefetch={false}
          >
            {HOME_COPY.SERIES_ALL_CTA}
          </ActionLink>
        }
      />
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
