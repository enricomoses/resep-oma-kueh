import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { cn } from '@/utils';

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  tone?: 'surface' | 'cream';
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  children,
  tone = 'surface',
  className,
}: EmptyStateProps) {
  return (
    <Card tone={tone} className={cn('cart-empty-state', className)}>
      {icon ? (
        <div className="cart-empty-icon-wrap" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h1 className="cart-empty-title">{title}</h1>
      {description ? <p className="cart-empty-body">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
      {children ?? null}
    </Card>
  );
}
