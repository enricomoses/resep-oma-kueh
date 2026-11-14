'use client';

import { Trash2 } from 'lucide-react';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

function getClockBadgeTone(clockState: 'scheduled' | 'active' | 'ended') {
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
    <Card tone="surface" className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-burgundy font-serif text-lg font-bold">
              {item.title}
            </h3>
            <Badge tone={getClockBadgeTone(clockState)}>
              {PROMOTION_COPY.CLOCK_LABELS[clockState]}
            </Badge>
            <Badge tone={item.status === 'published' ? 'success' : 'neutral'}>
              {ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS[item.status]}
            </Badge>
            <Badge tone={item.isEnabled ? 'accent' : 'neutral'}>
              {item.isEnabled ? 'Toggle Aktif' : 'Toggle Nonaktif'}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            Slug: <code>{item.slug}</code> · Prioritas: {item.priority}
          </p>
        </div>

        <div className="admin-inline-actions">
          <Button variant="secondary" size="sm" onClick={() => onEdit(item)}>
            Ubah
          </Button>
          {item.status !== 'archived' ? (
            <Button variant="ghost" size="sm" onClick={() => onArchive(item)}>
              <Trash2 size={14} aria-hidden="true" />
              Arsipkan
            </Button>
          ) : null}
        </div>
      </div>

      {item.bannerImageUrl ? (
        <div className="relative h-28 w-full max-w-md overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-sand)]">
          <Image
            src={item.bannerImageUrl}
            alt={`Banner ${item.title}`}
            fill
            sizes="(max-width: 768px) 100vw, 448px"
            unoptimized
            className="object-cover"
          />
        </div>
      ) : null}

      {item.description ? (
        <p className="text-cocoa text-sm">{item.description}</p>
      ) : null}

      <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="text-muted-foreground block">Nilai Diskon</span>
          <strong>
            {item.discountType === 'percentage'
              ? `${item.discountValue}%`
              : `${formatIdr(item.discountValue)} / unit`}
          </strong>
          {item.maxDiscountIdr !== null ? (
            <span className="text-muted-foreground block">
              Maks. {formatIdr(item.maxDiscountIdr)} / baris
            </span>
          ) : null}
        </div>

        <div>
          <span className="text-muted-foreground block">
            Min. Belanja Eligible
          </span>
          <strong>{formatIdr(item.minSpendIdr)}</strong>
        </div>

        <div>
          <span className="text-muted-foreground block">Scope & Target</span>
          <strong>{PROMOTION_COPY.SCOPE_LABELS[item.scope]}</strong>
          {item.scope !== 'all' ? (
            <span className="text-muted-foreground block">
              {targetCount} target dipilih
            </span>
          ) : null}
        </div>

        <div>
          <span className="text-muted-foreground block">
            Cabang & Jadwal WIB
          </span>
          <strong>
            {item.branchIds.length === 0
              ? PROMOTION_COPY.ALL_ACTIVE_BRANCHES_LABEL
              : `${item.branchIds.length} cabang dipilih`}
          </strong>
          <span className="text-muted-foreground block">
            {formatJakartaDateTimeDisplay(item.startsAt)} –{' '}
            {formatJakartaDateTimeDisplay(item.endsAt)}
          </span>
        </div>
      </div>
    </Card>
  );
}
