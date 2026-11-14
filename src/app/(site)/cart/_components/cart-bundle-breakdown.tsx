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
      <p className="text-burgundy font-semibold">Komposisi Pilihan:</p>
      <ul className="text-cocoa list-inside list-disc space-y-0.5 text-xs">
        {items.map((item, idx) => (
          <li key={`${item.slotOrGroup}-${item.label}-${idx}`}>
            {item.slotOrGroup}: {item.label} ({item.quantity} potong)
          </li>
        ))}
      </ul>
    </div>
  );
}
