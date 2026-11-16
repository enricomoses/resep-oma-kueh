import { Tag } from 'lucide-react';

import { EmptyState } from '@/components/common/feedback/empty-state';
import { SectionHeader } from '@/components/common/layout/section-header';
import { Feedback } from '@/components/ui/feedback';
import { HOME_COPY, HOME_SECTION_IDS } from '@/constants/home.constant';
import type { HomePromotion, HomeSectionResult } from '@/types/home';
import type { PublicShippingBanner } from '@/types/promotion';
import { cn } from '@/utils';

import { TreatCard } from './treat-card';

interface CurrentTreatsSectionProps {
  promotions: HomeSectionResult<HomePromotion[]>;
  selectedBranchId: string | null;
  selectedBranchName: string | null;
  shippingBanner?: PublicShippingBanner | null;
  className?: string;
}

export function CurrentTreatsSection({
  promotions,
  selectedBranchId,
  selectedBranchName,
  shippingBanner,
  className,
}: CurrentTreatsSectionProps) {
  const visiblePromotions =
    promotions.status === 'success'
      ? promotions.data.filter(
          (promo) =>
            promo.branchIds.length === 0 ||
            selectedBranchId === null ||
            promo.branchIds.includes(selectedBranchId),
        )
      : [];

  return (
    <section
      id={HOME_SECTION_IDS.TREATS}
      className={cn('home-section', className)}
      aria-labelledby="home-treats-title"
    >
      <SectionHeader
        titleId="home-treats-title"
        title={HOME_COPY.TREATS_TITLE}
        subtitle={HOME_COPY.TREATS_SUBTITLE}
      />
      {shippingBanner ? (
        <Feedback tone="info" title={shippingBanner.title} className="mb-4">
          <p className="text-xs">{shippingBanner.body}</p>
        </Feedback>
      ) : null}
      {promotions.status === 'error' ? (
        <Feedback tone="error" title={HOME_COPY.TREATS_ERROR} />
      ) : visiblePromotions.length === 0 ? (
        <EmptyState
          icon={<Tag size={24} strokeWidth={1.65} aria-hidden="true" />}
          title={HOME_COPY.TREATS_EMPTY}
          headingAs="h3"
        />
      ) : (
        <div className="home-treats-grid">
          {visiblePromotions.map((promotion) => (
            <TreatCard
              key={promotion.id}
              promotion={promotion}
              selectedBranchName={selectedBranchName}
            />
          ))}
        </div>
      )}
    </section>
  );
}
