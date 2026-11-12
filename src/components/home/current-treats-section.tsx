import { Tag } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { HOME_COPY, HOME_SECTION_IDS } from '@/constants/home.constant';
import { cn } from '@/utils';
import type { HomePromotion, HomeSectionResult } from '@/types/home';

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
  className?: string;
}
export function CurrentTreatsSection({
  promotions,
  selectedBranchId,
  selectedBranchName,
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
      <div className="home-section-header">
        <div>
          <h2 id="home-treats-title" className="editorial-heading">
            {HOME_COPY.TREATS_TITLE}
          </h2>
          <p className="home-section-subtitle">{HOME_COPY.TREATS_SUBTITLE}</p>
        </div>
      </div>
      {promotions.status === 'error' ? (
        <Feedback tone="error" title={HOME_COPY.TREATS_ERROR} />
      ) : visiblePromotions.length === 0 ? (
        <Feedback title={HOME_COPY.TREATS_EMPTY} />
      ) : (
        <div className="home-treats-grid">
          {visiblePromotions.map((promotion) => (
            <Card key={promotion.id} className="home-treat-card">
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
