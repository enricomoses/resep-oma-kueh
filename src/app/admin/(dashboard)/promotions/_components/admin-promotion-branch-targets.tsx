'use client';

import type { AdminPromotionReferenceOptions } from '@/types/promotion';

interface AdminPromotionBranchTargetsProps {
  branches: AdminPromotionReferenceOptions['branches'];
  selectedBranchIds: string[];
  errorMessage?: string;
  onToggleBranch: (branchId: string) => void;
}

/** Checkbox list for selecting which bakery branches a promotion applies to. */
export function AdminPromotionBranchTargets({
  branches,
  selectedBranchIds,
  errorMessage,
  onToggleBranch,
}: AdminPromotionBranchTargetsProps) {
  return (
    <div className="space-y-2 border-t border-[var(--border-sand)] pt-4">
      <p className="ui-field-label">
        Target Cabang (Kosongkan untuk Semua Cabang Aktif)
      </p>
      {errorMessage ? (
        <p className="text-xs text-danger">{errorMessage}</p>
      ) : null}
      <div className="flex flex-wrap gap-4">
        {branches.map((branch) => (
          <label
            key={branch.id}
            className="flex cursor-pointer items-center gap-2 text-xs"
          >
            <input
              type="checkbox"
              checked={selectedBranchIds.includes(branch.id)}
              onChange={() => onToggleBranch(branch.id)}
            />
            <span>
              {branch.name}
              {!branch.isActive ? ' (Nonaktif)' : ''}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
