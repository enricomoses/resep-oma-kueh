import type { BundleBreakdownItem } from '@/types/catalog';
import { cn } from '@/utils';

interface CartBundleBreakdownProps {
  items: readonly BundleBreakdownItem[];
  className?: string;
}

export function CartBundleBreakdown({
  items,
  className,
}: CartBundleBreakdownProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cn('cart-item-bundle-breakdown', className)}>
      <p className="cart-item-bundle-title">Komposisi Pilihan</p>
      <ul className="cart-item-bundle-list">
        {items.map((item, idx) => (
          <li
            key={`${item.slotOrGroup}-${item.label}-${idx}`}
            className="cart-item-bundle-item"
          >
            <span className="cart-item-bundle-slot">{item.slotOrGroup}:</span>{' '}
            <span>
              {item.label} ({item.quantity} potong)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
