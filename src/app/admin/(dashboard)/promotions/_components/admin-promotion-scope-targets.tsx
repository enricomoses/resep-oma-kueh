'use client';

import type { AdminPromotionTargetSummary } from '@/types/promotion';
import { cn } from '@/utils';

interface AdminPromotionScopeTargetsProps {
  items: AdminPromotionTargetSummary[];
  selectedIds: string[];
  emptyText: string;
  onToggle: (id: string) => void;
  className?: string;
}

export function AdminPromotionScopeTargets({
  items,
  selectedIds,
  emptyText,
  onToggle,
  className,
}: AdminPromotionScopeTargetsProps) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-xs">{emptyText}</p>;
  }

  return (
    <div
      className={cn(
        'grid max-h-48 gap-2 overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--border-sand)] p-3 sm:grid-cols-2',
        className,
      )}
    >
      {items.map((item) => (
        <label
          key={item.id}
          className="flex cursor-pointer items-start gap-2 text-xs"
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(item.id)}
            onChange={() => onToggle(item.id)}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium">{item.label}</span>
            {item.secondaryLabel ? (
              <span className="text-muted-foreground block text-[11px]">
                {item.secondaryLabel}
              </span>
            ) : null}
            {!item.isPublishEligible ? (
              <span className="block text-[11px] text-danger">
                Belum terpublikasi / nonaktif
              </span>
            ) : null}
          </span>
        </label>
      ))}
    </div>
  );
}
