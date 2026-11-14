'use client';

import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { ROUTES } from '@/constants/routes.constant';
import { BRANCH } from '@/constants/site.constant';
import { useBranchContext } from '@/providers/branch-provider';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';

interface CartBadgeProps {
  className?: string;
}

export function CartBadge({ className }: CartBadgeProps) {
  const { cartItemCount } = useBranchContext();
  const searchParams = useSearchParams();
  const branchParam = searchParams.get(BRANCH.PARAM);
  const cartHref = withBranch(ROUTES.CART, branchParam);

  return (
    <Link
      href={cartHref}
      className={cn(
        'ui-btn ui-btn-ghost cart-badge relative inline-flex items-center justify-center font-medium transition-colors',
        className,
      )}
      aria-label={
        cartItemCount === 0
          ? 'Keranjang belanja kosong · 0 item'
          : `Keranjang belanja · ${cartItemCount} item`
      }
    >
      <ShoppingBag size={20} aria-hidden="true" />
      <span aria-hidden="true" className="font-semibold">
        {cartItemCount}
      </span>
      <span className="sr-only">
        {cartItemCount === 0
          ? 'Keranjang kosong'
          : `${cartItemCount} item dalam keranjang`}
      </span>
    </Link>
  );
}
