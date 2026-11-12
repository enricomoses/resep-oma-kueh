'use client';
import { ShoppingBag } from 'lucide-react';
import { useBranchContext } from '@/providers/branch-provider';
import { SITE_COPY } from '@/constants/site.constant';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils';

interface CartBadgeProps {
  className?: string;
}
export function CartBadge({ className }: CartBadgeProps) {
  const { cartItemCount } = useBranchContext();
  return (
    <Button
      variant="ghost"
      disabled
      className={cn('cart-badge', className)}
      aria-label={
        cartItemCount === 0
          ? SITE_COPY.CART_EMPTY
          : `Keranjang · ${cartItemCount} item`
      }
      title={SITE_COPY.CART_PENDING}
    >
      <ShoppingBag size={20} aria-hidden="true" />
      <span aria-hidden="true">{cartItemCount}</span>
    </Button>
  );
}
