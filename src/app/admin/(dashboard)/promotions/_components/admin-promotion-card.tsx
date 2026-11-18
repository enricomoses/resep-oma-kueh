'use client';

import { Archive, Pencil } from 'lucide-react';
import Image from 'next/image';

import { StatusIndicator } from '@/components/common/status/status-indicator';
import { Button } from '@/components/ui/button';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { PROMOTION_COPY } from '@/constants/promotion.constant';
import type { AdminPromotionItem } from '@/types/promotion';
import { cn, formatIdr } from '@/utils';
import {
  derivePromotionClockState,
  formatJakartaDateTimeDisplay,
} from '@/utils/admin-promotions';

interface AdminPromotionCardProps {
  item: AdminPromotionItem;
  onEdit: (item: AdminPromotionItem) => void;
  onArchive: (item: AdminPromotionItem) => void;
  className?: string;
}

function getClockTone(clockState: 'scheduled' | 'active' | 'ended') {
  if (clockState === 'active') return 'success' as const;
  if (clockState === 'scheduled') return 'accent' as const;
  return 'neutral' as const;
}

export function AdminPromotionCard({
  item,
  onEdit,
  onArchive,
  className,
}: AdminPromotionCardProps) {
  const clockState = derivePromotionClockState(item.startsAt, item.endsAt);
  const targetCount =
    item.scope === 'category'
      ? item.categoryIds.length
      : item.scope === 'product'
        ? item.productIds.length
        : item.scope === 'variant'
          ? item.variantIds.length
          : 0;

  return (
    <li className={cn('admin-promo-row', className)}>
      <div className="admin-promo-row-head">
        <div className="admin-promo-row-identity">
          <div className="admin-promo-row-title-line">
            <h3 className="admin-promo-row-title admin-wrap-text">
              {item.title}
            </h3>
            <StatusIndicator
              tone={getClockTone(clockState)}
              label={PROMOTION_COPY.CLOCK_LABELS[clockState]}
            />
          </div>
          <p className="admin-promo-row-meta">
            <code className="admin-promo-slug">{item.slug}</code>
            <span>·</span>
            <span>
              {ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS[item.status]}
            </span>
            <span>·</span>
            <span>{item.isEnabled ? 'Toggle Aktif' : 'Toggle Nonaktif'}</span>
            <span>·</span>
            <span>Prioritas #{item.priority}</span>
          </p>
        </div>

        <div className="admin-inline-actions">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onEdit(item)}
          >
            <Pencil size={14} aria-hidden="true" />
            <span>Ubah</span>
          </Button>
          {item.status !== 'archived' ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onArchive(item)}
            >
              <Archive size={14} aria-hidden="true" />
              <span>Arsipkan</span>
            </Button>
          ) : null}
        </div>
      </div>

      {item.bannerImageUrl ? (
        <div className="admin-promo-banner-thumb">
          <Image
            src={item.bannerImageUrl}
            alt={`Banner ${item.title}`}
            fill
            sizes="(max-width: 768px) 100vw, 384px"
            unoptimized
            className="object-cover"
          />
        </div>
      ) : null}

      {item.description ? (
        <p className="admin-promo-desc admin-wrap-text">{item.description}</p>
      ) : null}

      <div className="admin-promo-specs">
        <div className="admin-promo-spec-item">
          <span className="admin-promo-spec-label">Nilai Diskon</span>
          <strong className="admin-promo-spec-value">
            {item.discountType === 'percentage'
              ? `${item.discountValue}%`
              : `${formatIdr(item.discountValue)} / unit`}
          </strong>
          {item.maxDiscountIdr !== null ? (
            <span className="admin-promo-spec-sub">
              Maks. {formatIdr(item.maxDiscountIdr)} / baris
            </span>
          ) : null}
        </div>

        <div className="admin-promo-spec-item">
          <span className="admin-promo-spec-label">Min. Belanja Eligible</span>
          <strong className="admin-promo-spec-value">
            {formatIdr(item.minSpendIdr)}
          </strong>
        </div>

        <div className="admin-promo-spec-item">
          <span className="admin-promo-spec-label">Scope &amp; Target</span>
          <strong className="admin-promo-spec-value">
            {PROMOTION_COPY.SCOPE_LABELS[item.scope]}
          </strong>
          {item.scope !== 'all' ? (
            <span className="admin-promo-spec-sub">
              {targetCount} target dipilih
            </span>
          ) : null}
        </div>

        <div className="admin-promo-spec-item">
          <span className="admin-promo-spec-label">
            Cabang &amp; Jadwal WIB
          </span>
          <strong className="admin-promo-spec-value">
            {item.branchIds.length === 0
              ? PROMOTION_COPY.ALL_ACTIVE_BRANCHES_LABEL
              : `${item.branchIds.length} cabang dipilih`}
          </strong>
          <span className="admin-promo-spec-sub">
            {formatJakartaDateTimeDisplay(item.startsAt)} –{' '}
            {formatJakartaDateTimeDisplay(item.endsAt)}
          </span>
        </div>
      </div>
    </li>
  );
}
