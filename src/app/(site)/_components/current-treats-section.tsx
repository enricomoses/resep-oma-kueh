import { Tag } from 'lucide-react';
import Image from 'next/image';

import { SectionHeader } from '@/components/common/layout/section-header';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { HOME_COPY, HOME_SECTION_IDS } from '@/constants/home.constant';
import type { HomePromotion, HomeSectionResult } from '@/types/home';
import type { PublicShippingBanner } from '@/types/promotion';
import { cn } from '@/utils';
import { formatJakartaDateTimeDisplay } from '@/utils/admin-promotions';

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

function formatDiscountLabel(promotion: HomePromotion) {
  if (promotion.discountType === 'percentage') {
    return `Diskon ${promotion.discountValue}%`;
  }
  return `Potongan ${rupiahFormatter.format(promotion.discountValue)}`;
}

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
        <Feedback title={HOME_COPY.TREATS_EMPTY} />
      ) : (
        <div className="home-treats-grid">
          {visiblePromotions.map((promotion) => (
            <Card key={promotion.id} className="home-treat-card">
              {promotion.bannerImageUrl ? (
                <div className="relative mb-3 h-36 w-full overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-sand)]">
                  <Image
                    src={promotion.bannerImageUrl}
                    alt={`Banner promosi ${promotion.title}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 380px"
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div className="home-treat-header">
                <span className="home-campaign-pill">
                  <Tag size={14} aria-hidden="true" />
                  {HOME_COPY.TREATS_BADGE}
                </span>
                <span className="home-campaign-value">
                  {formatDiscountLabel(promotion)}
                </span>
              </div>
              <h3>{promotion.title}</h3>
              {promotion.description ? <p>{promotion.description}</p> : null}
              <p className="text-muted-foreground text-xs">
                {formatJakartaDateTimeDisplay(promotion.startsAt)} –{' '}
                {formatJakartaDateTimeDisplay(promotion.endsAt)}
              </p>
              <p className="home-price-note">
                {promotion.branchIds.length === 0
                  ? HOME_COPY.TREATS_ALL_BRANCHES
                  : selectedBranchName
                    ? `${HOME_COPY.TREATS_SCOPED_BRANCH}: ${selectedBranchName}`
                    : HOME_COPY.TREATS_SCOPED_BRANCH}
              </p>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
