'use client';

import { CalendarDays, MapPin, Tag } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { HOME_COPY } from '@/constants/home.constant';
import { PROMOTION_COPY } from '@/constants/promotion.constant';
import type { HomePromotion } from '@/types/home';
import { cn, formatIdr } from '@/utils';
import { formatJakartaDateTimeDisplay } from '@/utils/admin-promotions';

function formatDiscountLabel(promotion: HomePromotion) {
  if (promotion.discountType === 'percentage') {
    return `Diskon ${promotion.discountValue}%`;
  }
  return `Potongan ${formatIdr(promotion.discountValue)}`;
}

function buildConditionSummary(promotion: HomePromotion): string | null {
  const parts: string[] = [];
  if (promotion.minSpendIdr > 0) {
    parts.push(`Min. belanja ${formatIdr(promotion.minSpendIdr)}`);
  }
  if (promotion.maxDiscountIdr !== null && promotion.maxDiscountIdr > 0) {
    parts.push(`Maks. potongan ${formatIdr(promotion.maxDiscountIdr)}`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

interface TreatCardProps {
  promotion: HomePromotion;
  selectedBranchName: string | null;
  className?: string;
}

/**
 * Editorial promo offer card for Current Treats with clamped copy, overflow
 * guards, concise discount terms, validity dates, and branch applicability.
 */
export function TreatCard({
  promotion,
  selectedBranchName,
  className,
}: TreatCardProps) {
  const [failedBannerUrl, setFailedBannerUrl] = useState<string | null>(null);
  const showBanner =
    Boolean(promotion.bannerImageUrl) &&
    failedBannerUrl !== promotion.bannerImageUrl;

  const conditionSummary = buildConditionSummary(promotion);
  const branchLabel =
    promotion.branchIds.length === 0
      ? HOME_COPY.TREATS_ALL_BRANCHES
      : selectedBranchName
        ? `${HOME_COPY.TREATS_SCOPED_BRANCH}: ${selectedBranchName}`
        : HOME_COPY.TREATS_SCOPED_BRANCH;

  return (
    <Card className={cn('home-treat-card', className)}>
      {showBanner && promotion.bannerImageUrl ? (
        <div className="home-treat-banner">
          <Image
            src={promotion.bannerImageUrl}
            alt={`Banner promosi ${promotion.title}`}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            unoptimized
            className="home-treat-banner-img"
            onError={() => setFailedBannerUrl(promotion.bannerImageUrl ?? null)}
          />
        </div>
      ) : null}

      <div className="home-treat-offer-band">
        <div className="home-treat-offer-top">
          <span className="home-campaign-pill">
            <Tag size={12} aria-hidden="true" />
            {HOME_COPY.TREATS_BADGE}
          </span>
          <Badge tone="neutral" className="home-treat-scope-badge">
            {PROMOTION_COPY.SCOPE_LABELS[promotion.scope]}
          </Badge>
        </div>

        <p className="home-campaign-value">{formatDiscountLabel(promotion)}</p>

        {conditionSummary ? (
          <p className="home-treat-terms">{conditionSummary}</p>
        ) : null}
      </div>

      <div className="home-treat-body">
        <h3 className="home-treat-title">{promotion.title}</h3>
        {promotion.description ? (
          <p className="home-treat-description">{promotion.description}</p>
        ) : null}
      </div>

      <div className="home-treat-footer">
        <p className="home-treat-meta-line">
          <CalendarDays size={14} aria-hidden="true" />
          <span>
            {formatJakartaDateTimeDisplay(promotion.startsAt)} –{' '}
            {formatJakartaDateTimeDisplay(promotion.endsAt)}
          </span>
        </p>
        <p className="home-treat-meta-line home-treat-meta-line--branch">
          <MapPin size={14} aria-hidden="true" />
          <span>{branchLabel}</span>
        </p>
      </div>
    </Card>
  );
}
