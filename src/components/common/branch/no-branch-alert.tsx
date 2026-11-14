import { AlertTriangle } from 'lucide-react';

import { cn } from '@/utils';

interface NoBranchAlertProps {
  message: string;
  className?: string;
}

export function NoBranchAlert({ message, className }: NoBranchAlertProps) {
  return (
    <div className={cn('cart-alert-no-branch', className)} role="alert">
      <AlertTriangle
        size={18}
        className="shrink-0 text-amber-600"
        aria-hidden="true"
      />
      <p className="text-xs font-medium text-amber-900">{message}</p>
    </div>
  );
}
