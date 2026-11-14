import { Badge } from '@/components/ui/badge';
import { CART_CONFLICTS, CART_COPY } from '@/constants/cart.constant';
import type { CartConflictType } from '@/types/cart';
import { cn } from '@/utils';

interface CartConflictBadgeProps {
  conflict: CartConflictType;
  availabilityStatus: 'available' | 'sold_out' | 'unconfirmed' | 'archived';
  className?: string;
}

const CONFLICT_BADGE_MAP: Partial<
  Record<CartConflictType, { label: string; tone: 'danger' | 'accent' }>
> = {
  [CART_CONFLICTS.SOLD_OUT]: {
    label: CART_COPY.CONFLICT_SOLD_OUT,
    tone: 'danger',
  },
  [CART_CONFLICTS.NOT_OFFERED]: {
    label: CART_COPY.CONFLICT_NOT_OFFERED,
    tone: 'danger',
  },
  [CART_CONFLICTS.COMPONENT_UNAVAILABLE]: {
    label: CART_COPY.CONFLICT_COMPONENT_UNAVAILABLE,
    tone: 'danger',
  },
  [CART_CONFLICTS.ARCHIVED]: {
    label: CART_COPY.CONFLICT_ARCHIVED,
    tone: 'danger',
  },
  [CART_CONFLICTS.PRICE_CHANGED]: {
    label: CART_COPY.CONFLICT_PRICE_CHANGED,
    tone: 'accent',
  },
};

export function CartConflictBadge({
  conflict,
  availabilityStatus,
  className,
}: CartConflictBadgeProps) {
  const mapped = CONFLICT_BADGE_MAP[conflict];
  if (mapped) {
    return (
      <Badge tone={mapped.tone} className={cn(className)}>
        {mapped.label}
      </Badge>
    );
  }

  if (availabilityStatus === 'unconfirmed') {
    return (
      <Badge tone="accent" className={cn(className)}>
        Konfirmasi via WA
      </Badge>
    );
  }

  return null;
}
