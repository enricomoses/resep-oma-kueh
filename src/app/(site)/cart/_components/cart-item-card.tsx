'use client';

import { Trash2 } from 'lucide-react';
import Link from 'next/link';

import { MediaPlaceholder } from '@/components/common/media-placeholder';
import { PriceDisplay } from '@/components/common/commerce/price-display';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Quantity } from '@/components/ui/quantity';
import { CART_CONFLICTS, CART_COPY } from '@/constants/cart.constant';
import { ROUTES } from '@/constants/routes.constant';
import type { CartValidatedLine } from '@/types/cart';
import { cn, formatIdr } from '@/utils';
import { withBranch } from '@/utils/branch-url';

import { CartBundleBreakdown } from './cart-bundle-breakdown';
import { CartConflictBadge } from './cart-conflict-badge';

interface CartItemCardProps {
  line: CartValidatedLine;
  branchCode: string | null | undefined;
  onUpdateQuantity: (lineId: string, nextQuantity: number) => void;
  onRemoveLine: (lineId: string) => void;
  className?: string;
}

export function CartItemCard({
  line,
  branchCode,
  onUpdateQuantity,
  onRemoveLine,
  className,
}: CartItemCardProps) {
  const hasConflict = line.conflict !== CART_CONFLICTS.NONE;
  const itemDetailHref = withBranch(
    `${ROUTES.MENU}/${encodeURIComponent(line.productSlug)}`,
    branchCode,
  );

  return (
    <Card
      className={cn(
        'cart-item-card',
        hasConflict && 'cart-item-card-conflict',
        className,
      )}
    >
      <div className="cart-item-grid">
        <div className="cart-item-thumbnail-wrap">
          <MediaPlaceholder
            caption={line.imageAlt}
            className="cart-item-media"
          />
        </div>

        <div className="cart-item-details">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <Link href={itemDetailHref} className="cart-item-product-name">
                {line.productName}
              </Link>
              <p className="cart-item-variant-label">
                {line.sizeLabel || line.variantName}
              </p>
            </div>

            <CartConflictBadge
              conflict={line.conflict}
              availabilityStatus={line.availabilityStatus}
            />
          </div>

          <CartBundleBreakdown items={line.bundleBreakdown ?? []} />

          <div className="cart-item-footer">
            <PriceDisplay
              effectivePriceIdr={line.effectiveUnitPriceIdr}
              grossPriceIdr={line.unitGrossIdr}
              unitLabel="per unit"
            />

            <div className="flex items-center gap-4">
              <Quantity
                value={line.quantity}
                min={1}
                max={99}
                onChange={(newQty) => onUpdateQuantity(line.lineId, newQty)}
                label={`Jumlah ${line.productName}`}
              />

              <div className="text-right">
                <span className="text-burgundy block font-serif text-base font-bold">
                  {formatIdr(line.subtotalIdr)}
                </span>
                <Button
                  variant="ghost"
                  onClick={() => onRemoveLine(line.lineId)}
                  className="cart-item-remove-btn"
                  aria-label={`Hapus ${line.productName} dari keranjang`}
                >
                  <Trash2 size={14} aria-hidden="true" />
                  <span>{CART_COPY.REMOVE_ITEM}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
