import { Store } from 'lucide-react';

import { cn } from '@/utils';

interface BranchStatusPillProps {
  label: string;
  branchName: string;
  className?: string;
}

export function BranchStatusPill({
  label,
  branchName,
  className,
}: BranchStatusPillProps) {
  return (
    <div className={cn('cart-branch-pill', className)}>
      <Store size={16} aria-hidden="true" />
      <span>
        {label}: <strong>{branchName}</strong>
      </span>
    </div>
  );
}
