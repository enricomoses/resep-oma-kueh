import { ArrowRight, CalendarDays } from 'lucide-react';
import type { ReactNode } from 'react';

import { MenuProductCardMedia } from '@/components/common/commerce/menu-product-card-media';
import { ProductBadgeRow } from '@/components/common/commerce/product-badge-row';
import type { ProductBadgeItem } from '@/components/common/commerce/product-badge-row';
import { ActionLink } from '@/components/ui/action-link';
import { Card } from '@/components/ui/card';
import { CLASSES_COPY } from '@/constants/classes.constant';
import '@/styles/components/baking-class-card.css';
import '@/styles/components/product-card.css';
import { cn } from '@/utils';
import { formatIdr } from '@/utils/currency';

interface BakingClassCardProps {
  title: string;
  titleAs?: 'h2' | 'h3';
  description: string;
  coverImageUrl?: string | null;
  coverAlt: string;
  badges: ProductBadgeItem[];
  scheduleText: string;
  scheduleMuted?: boolean;
  scheduleNote?: string | null;
  scheduleAction?: ReactNode;
  priceIdr?: number | null;
  priceFallbackNote?: string;
  href: string;
  ctaLabel?: string;
  ctaVariant?: 'primary' | 'secondary';
  className?: string;
}

/**
 * Shared landscape Baking Class card (used on Home & /classes) with portrait
 * cover thumbnail, clamped editorial details, schedule, price, and CTA.
 */
export function BakingClassCard({
  title,
  titleAs = 'h3',
  description,
  coverImageUrl = null,
  coverAlt,
  badges,
  scheduleText,
  scheduleMuted = false,
  scheduleNote = null,
  scheduleAction,
  priceIdr = null,
  priceFallbackNote,
  href,
  ctaLabel = CLASSES_COPY.DETAIL_CTA,
  ctaVariant = 'secondary',
  className,
}: BakingClassCardProps) {
  const TitleTag = titleAs;

  return (
    <Card className={cn('baking-class-card', className)}>
      <div className="baking-class-card-media-col">
        <MenuProductCardMedia
          previewImageUrl={coverImageUrl}
          imageAlt={coverAlt || title}
          placeholderCaption={coverAlt}
          className="baking-class-media"
        />
      </div>

      <div className="baking-class-card-main">
        <ProductBadgeRow
          items={badges}
          moreAriaLabel={CLASSES_COPY.BADGE_MORE_ARIA_LABEL(badges.length)}
        />

        <TitleTag className="baking-class-card-title">{title}</TitleTag>
        <p className="baking-class-card-description">{description}</p>

        <div className="baking-class-card-schedule-block">
          <p
            className={cn(
              'baking-class-schedule-line',
              scheduleMuted && 'baking-class-schedule-line--muted',
            )}
          >
            <CalendarDays size={14} aria-hidden="true" />
            <span>{scheduleText}</span>
          </p>
          {scheduleNote ? (
            <p className="baking-class-schedule-note">{scheduleNote}</p>
          ) : null}
          {scheduleAction}
        </div>

        <div className="baking-class-card-footer">
          {priceIdr !== null && priceIdr !== undefined ? (
            <p className="menu-product-price baking-class-card-price">
              <strong>{formatIdr(priceIdr)}</strong>
            </p>
          ) : (
            <p className="home-price-note">
              {priceFallbackNote ?? CLASSES_COPY.PRICE_CONFIRM_NOTE}
            </p>
          )}

          <ActionLink
            href={href}
            variant={ctaVariant}
            size="sm"
            prefetch={false}
            className="baking-class-card-cta"
          >
            {ctaLabel}
            <ArrowRight size={15} aria-hidden="true" />
          </ActionLink>
        </div>
      </div>
    </Card>
  );
}
